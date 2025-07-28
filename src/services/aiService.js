import OpenAI from 'openai';
import { ghlService } from './ghlService';
import { debugService } from './debugService';

class AIService {
  constructor() {
    this.openai = null;
    this.conversationHistory = [];
    this.userContext = {
      recentContacts: [],
      activeOpportunities: [],
      preferences: {},
      commonPatterns: []
    };
    this.businessInsights = new Map();
  }

  initializeOpenAI(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    if (this.openai && this.currentApiKey === apiKey) {
      return;
    }
    
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.currentApiKey = apiKey;
  }

  updateUserContext(key, value) {
    this.userContext[key] = value;
    debugService.log('Updated user context', { key, value });
  }

  addToConversationHistory(role, content, toolCalls = null) {
    this.conversationHistory.push({
      role,
      content,
      toolCalls,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 exchanges to manage token usage
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  getBusinessInsights(data) {
    const insights = [];
    
    // Analyze contacts
    if (data.contacts) {
      const totalContacts = data.contacts.length;
      const taggedContacts = data.contacts.filter(c => c.tags && c.tags.length > 0).length;
      const recentContacts = data.contacts.filter(c => 
        new Date(c.dateAdded) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      insights.push(`📊 Contact Analysis: ${totalContacts} total, ${recentContacts} added this week, ${taggedContacts} tagged`);
    }

    // Analyze opportunities
    if (data.opportunities) {
      const totalValue = data.opportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
      const stages = data.opportunities.reduce((acc, opp) => {
        acc[opp.status] = (acc[opp.status] || 0) + 1;
        return acc;
      }, {});
      
      insights.push(`💰 Pipeline Analysis: $${totalValue.toLocaleString()} total value, ${Object.entries(stages).map(([stage, count]) => `${count} in ${stage}`).join(', ')}`);
    }

    return insights;
  }

  async processCommand(command, config) {
    try {
      if (!config.openaiApiKey) {
        throw new Error('OpenAI API key is required');
      }

      this.initializeOpenAI(config.openaiApiKey);
      this.addToConversationHistory('user', command);

      const tools = ghlService.getAvailableTools();
      debugService.log('Processing command with enhanced AI', { command, toolsCount: tools.length });

      const systemPrompt = `You are an advanced AI business assistant specializing in GoHighLevel (GHL) CRM management. You help business owners efficiently manage their entire operation while they're on the go.

CORE CAPABILITIES:
You have access to comprehensive GHL MCP endpoints for:
- Contact Management (search, create, update, tag, notes)
- Conversation & Messaging (SMS, email, chat history)
- Opportunity Management (pipeline tracking, stage updates)
- Calendar & Appointments (scheduling, availability)
- Payment Processing (orders, transactions)
- Forms & Custom Data (submissions, field management)
- Workflow Automation (trigger management)
- Business Intelligence (reporting, analytics)

ENHANCED BUSINESS INTELLIGENCE:
- Analyze data patterns and provide actionable insights
- Suggest next best actions based on current context
- Identify opportunities and potential issues
- Provide KPI summaries and trend analysis
- Recommend workflow optimizations

CONVERSATION CONTEXT:
Recent conversation history: ${JSON.stringify(this.conversationHistory.slice(-6))}
User context: ${JSON.stringify(this.userContext)}

RESPONSE STYLE:
- Be concise yet comprehensive
- Provide business value in every response
- Include relevant metrics and insights
- Suggest follow-up actions
- Use emojis sparingly for clarity
- Format data in readable tables/lists

WORKFLOW INTELLIGENCE:
Common business workflows you should recognize and optimize:
1. Lead Management: Contact search → Tag/segment → Follow-up sequence
2. Sales Pipeline: Opportunity creation → Stage progression → Deal closure
3. Customer Service: Message response → Issue resolution → Follow-up
4. Appointment Setting: Availability check → Booking → Confirmation
5. Payment Processing: Order creation → Transaction tracking → Fulfillment

SMART PARAMETER INFERENCE:
- Use context from previous commands to fill missing parameters
- Reference recent contacts/opportunities when IDs are needed
- Suggest alternatives when requests are ambiguous
- Batch related operations for efficiency

AVAILABLE TOOLS:
${tools.map(t => `${t.name}: ${t.description} (Required scopes: ${t.scopes.join(', ')})`).join('\n')}

When processing requests:
1. Analyze the business intent behind the command
2. Determine the optimal sequence of API calls
3. Provide rich context and insights with results
4. Suggest relevant follow-up actions
5. Learn from patterns to improve future responses

Handle errors gracefully and always provide business value, even when data is limited.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...this.conversationHistory.slice(-6), // Include recent context
        { role: "user", content: command }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages,
        tools: tools.map(tool => ({
          type: "function",
          function: {
            name: tool.name,
            description: `${tool.description} (Required scopes: ${tool.scopes.join(', ')})`,
            parameters: tool.parameters
          }
        })),
        tool_choice: "auto",
        temperature: 0.1,
        max_tokens: 1000
      });

      const message = response.choices[0].message;
      debugService.log('Enhanced OpenAI response', message);

      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCalls = message.tool_calls.map(tc => {
          try {
            const parameters = JSON.parse(tc.function.arguments);
            const requiredScopes = ghlService.getRequiredScopes(tc.function.name);
            return {
              name: tc.function.name,
              parameters,
              requiredScopes
            };
          } catch (error) {
            debugService.error('Error parsing tool call arguments', error);
            throw new Error(`Invalid tool call format for ${tc.function.name}: ${error.message}`);
          }
        });

        this.addToConversationHistory('assistant', message.content, toolCalls);
        return {
          content: message.content,
          toolCalls
        };
      }

      this.addToConversationHistory('assistant', message.content);
      return {
        content: message.content,
        toolCalls: []
      };

    } catch (error) {
      debugService.error('Enhanced AI processing error', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  async generateResponse(originalCommand, toolResults, config) {
    try {
      if (!config.openaiApiKey) {
        return this.generateEnhancedSimpleResponse(originalCommand, toolResults);
      }

      this.initializeOpenAI(config.openaiApiKey);

      // Extract business data for insights
      const businessData = this.extractBusinessData(toolResults);
      const insights = this.getBusinessInsights(businessData);

      // Update user context with new data
      if (businessData.contacts) {
        this.updateUserContext('recentContacts', businessData.contacts.slice(0, 5));
      }
      if (businessData.opportunities) {
        this.updateUserContext('activeOpportunities', businessData.opportunities.slice(0, 5));
      }

      const resultsText = toolResults.map(result => {
        if (result.success) {
          return this.formatToolResult(result);
        } else {
          return `❌ ${result.name}: Failed - ${result.error}`;
        }
      }).join('\n');

      const prompt = `BUSINESS COMMAND: "${originalCommand}"

EXECUTED ACTIONS:
${resultsText}

BUSINESS INSIGHTS:
${insights.join('\n')}

CONTEXT:
- Recent contacts: ${this.userContext.recentContacts.length}
- Active opportunities: ${this.userContext.activeOpportunities.length}

INSTRUCTIONS:
Provide a comprehensive business-focused response that includes:
1. Clear summary of what was accomplished
2. Key business insights and metrics
3. Actionable next steps or recommendations
4. Any important patterns or opportunities identified
5. Suggestions for follow-up actions

Format the response professionally with clear sections. Use bullet points for lists and include relevant metrics. Keep it concise but valuable.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.3
      });

      const finalResponse = response.choices[0].message.content;
      this.addToConversationHistory('assistant', finalResponse);
      
      return finalResponse;

    } catch (error) {
      debugService.error('Error generating enhanced response', error);
      return this.generateEnhancedSimpleResponse(originalCommand, toolResults);
    }
  }

  extractBusinessData(toolResults) {
    const data = {};
    
    toolResults.forEach(result => {
      if (result.success && result.result) {
        if (result.result.contacts) {
          data.contacts = result.result.contacts;
        }
        if (result.result.opportunities) {
          data.opportunities = result.result.opportunities;
        }
        if (result.result.events) {
          data.events = result.result.events;
        }
        if (result.result.transactions) {
          data.transactions = result.result.transactions;
        }
        if (result.result.conversations) {
          data.conversations = result.result.conversations;
        }
      }
    });

    return data;
  }

  formatToolResult(result) {
    let resultStr = '';
    
    try {
      if (typeof result.result === 'object' && result.result !== null) {
        // Format different types of GHL responses
        if (result.result.contacts && Array.isArray(result.result.contacts)) {
          const contacts = result.result.contacts;
          resultStr = `✅ Found ${contacts.length} contacts`;
          if (contacts.length > 0) {
            const recent = contacts.filter(c => 
              new Date(c.dateAdded) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length;
            if (recent > 0) resultStr += ` (${recent} added this week)`;
          }
        } else if (result.result.opportunities && Array.isArray(result.result.opportunities)) {
          const opps = result.result.opportunities;
          const totalValue = opps.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
          resultStr = `✅ Found ${opps.length} opportunities`;
          if (totalValue > 0) resultStr += ` (Total value: $${totalValue.toLocaleString()})`;
        } else if (result.result.events && Array.isArray(result.result.events)) {
          const events = result.result.events;
          const today = new Date().toDateString();
          const todayEvents = events.filter(e => new Date(e.startTime).toDateString() === today).length;
          resultStr = `✅ Found ${events.length} events`;
          if (todayEvents > 0) resultStr += ` (${todayEvents} today)`;
        } else if (result.result.transactions && Array.isArray(result.result.transactions)) {
          const transactions = result.result.transactions;
          const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
          resultStr = `✅ Found ${transactions.length} transactions`;
          if (totalAmount > 0) resultStr += ` (Total: $${totalAmount.toLocaleString()})`;
        } else if (result.result.id) {
          resultStr = `✅ ${result.name}: Operation completed successfully (ID: ${result.result.id})`;
        } else {
          resultStr = `✅ ${result.name}: Operation completed successfully`;
        }
      } else {
        resultStr = `✅ ${result.name}: ${String(result.result).substring(0, 100)}`;
      }
    } catch (e) {
      resultStr = `✅ ${result.name}: Operation completed successfully`;
    }

    return resultStr;
  }

  generateEnhancedSimpleResponse(originalCommand, toolResults) {
    const successful = toolResults.filter(r => r.success).length;
    const failed = toolResults.filter(r => !r.success).length;
    
    let response = `## Command Execution Summary\n\n`;
    response += `✅ **${successful} action(s) completed successfully**\n`;
    if (failed > 0) {
      response += `❌ **${failed} action(s) failed**\n`;
    }
    response += `\n`;

    // Add specific business insights
    const businessData = this.extractBusinessData(toolResults);
    const insights = this.getBusinessInsights(businessData);
    
    if (insights.length > 0) {
      response += `## Business Insights\n\n`;
      insights.forEach(insight => {
        response += `${insight}\n`;
      });
      response += `\n`;
    }

    // Add detailed results
    response += `## Action Details\n\n`;
    toolResults.forEach(result => {
      if (result.success) {
        response += `${this.formatToolResult(result)}\n`;
      } else {
        response += `❌ ${result.name}: ${result.error}\n`;
      }
    });

    // Add next steps
    response += `\n## Suggested Next Steps\n\n`;
    if (businessData.contacts && businessData.contacts.length > 0) {
      response += `• Review and tag new contacts for better organization\n`;
      response += `• Set up follow-up sequences for recent leads\n`;
    }
    if (businessData.opportunities && businessData.opportunities.length > 0) {
      response += `• Update opportunity stages based on recent activities\n`;
      response += `• Schedule follow-up calls for high-value prospects\n`;
    }

    return response;
  }

  // Method to clear conversation history
  clearHistory() {
    this.conversationHistory = [];
    this.userContext = {
      recentContacts: [],
      activeOpportunities: [],
      preferences: {},
      commonPatterns: []
    };
    debugService.log('Conversation history and context cleared');
  }
}

export const aiService = new AIService();