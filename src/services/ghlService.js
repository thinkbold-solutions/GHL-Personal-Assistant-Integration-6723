import axios from 'axios';
import {debugService} from './debugService';

const GHL_MCP_URL = 'https://services.leadconnectorhq.com/mcp/';

class GHLService {
  constructor() {
    // Updated MCP endpoints to match EXACT names from official GHL MCP documentation
    this.endpoints = {
      // Contact Management - Updated to match MCP docs
      'contacts_get-contacts': {
        description: 'Get contacts from GHL',
        parameters: {
          type: 'object',
          properties: {
            query: {type: 'string', description: 'Search query for contacts'},
            limit: {type: 'number', description: 'Number of results to return (max 100)'},
            offset: {type: 'number', description: 'Offset for pagination'},
            tags: {type: 'array', items: {type: 'string'}, description: 'Filter by tags'},
            email: {type: 'string', description: 'Filter by email address'},
            phone: {type: 'string', description: 'Filter by phone number'}
          }
        },
        scopes: ['View Contacts']
      },
      'contacts_get-contact': {
        description: 'Fetch contact details',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Contact ID to fetch'}
          },
          required: ['contactId']
        },
        scopes: ['View Contacts']
      },
      'contacts_create-contact': {
        description: 'Create a contact',
        parameters: {
          type: 'object',
          properties: {
            firstName: {type: 'string', description: 'First name'},
            lastName: {type: 'string', description: 'Last name'},
            email: {type: 'string', description: 'Email address'},
            phone: {type: 'string', description: 'Phone number'},
            tags: {type: 'array', items: {type: 'string'}, description: 'Tags to assign'},
            customFields: {type: 'object', description: 'Custom field values'}
          },
          required: ['firstName', 'email']
        },
        scopes: ['Edit Contacts']
      },
      'contacts_update-contact': {
        description: 'Update a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Contact ID to update'},
            firstName: {type: 'string'},
            lastName: {type: 'string'},
            email: {type: 'string'},
            phone: {type: 'string'},
            tags: {type: 'array', items: {type: 'string'}},
            customFields: {type: 'object'}
          },
          required: ['contactId']
        },
        scopes: ['Edit Contacts']
      },
      'contacts_upsert-contact': {
        description: 'Update or create a new contact',
        parameters: {
          type: 'object',
          properties: {
            firstName: {type: 'string', description: 'First name'},
            lastName: {type: 'string', description: 'Last name'},
            email: {type: 'string', description: 'Email address'},
            phone: {type: 'string', description: 'Phone number'},
            tags: {type: 'array', items: {type: 'string'}, description: 'Tags to assign'},
            customFields: {type: 'object', description: 'Custom field values'}
          },
          required: ['email']
        },
        scopes: ['Edit Contacts']
      },
      'contacts_add-tags': {
        description: 'Add tags to a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Contact ID'},
            tags: {type: 'array', items: {type: 'string'}, description: 'Tags to add'}
          },
          required: ['contactId', 'tags']
        },
        scopes: ['Edit Contacts']
      },
      'contacts_remove-tags': {
        description: 'Remove tags from a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Contact ID'},
            tags: {type: 'array', items: {type: 'string'}, description: 'Tags to remove'}
          },
          required: ['contactId', 'tags']
        },
        scopes: ['Edit Contacts']
      },
      'contacts_get-all-tasks': {
        description: 'Get all tasks for a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Contact ID'},
            limit: {type: 'number', description: 'Number of results'},
            offset: {type: 'number', description: 'Pagination offset'}
          },
          required: ['contactId']
        },
        scopes: ['View Contacts']
      },

      // Calendar Management - Updated to match MCP docs
      'calendars_get-calendar-events': {
        description: 'Get calendar events (requires userId, groupId, or calendarId)',
        parameters: {
          type: 'object',
          properties: {
            calendarId: {type: 'string', description: 'Calendar ID'},
            userId: {type: 'string', description: 'User ID'},
            groupId: {type: 'string', description: 'Group ID'},
            startDate: {type: 'string', description: 'Start date (ISO format)'},
            endDate: {type: 'string', description: 'End date (ISO format)'},
            limit: {type: 'number', description: 'Number of results'}
          }
        },
        scopes: ['View Calendar Events']
      },
      'calendars_get-appointment-notes': {
        description: 'Retrieve appointment notes',
        parameters: {
          type: 'object',
          properties: {
            appointmentId: {type: 'string', description: 'Appointment ID'},
            contactId: {type: 'string', description: 'Contact ID'}
          }
        },
        scopes: ['View Calendars']
      },

      // Conversation Management - Updated to match MCP docs
      'conversations_search-conversation': {
        description: 'Search/filter/sort conversations',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Filter by contact ID'},
            query: {type: 'string', description: 'Search query'},
            limit: {type: 'number', description: 'Number of results'},
            offset: {type: 'number', description: 'Pagination offset'},
            unread: {type: 'boolean', description: 'Filter unread conversations'},
            sortBy: {type: 'string', description: 'Sort field'},
            sortOrder: {type: 'string', enum: ['asc', 'desc'], description: 'Sort order'}
          }
        },
        scopes: ['View Conversations']
      },
      'conversations_get-messages': {
        description: 'Get messages by conversation ID',
        parameters: {
          type: 'object',
          properties: {
            conversationId: {type: 'string', description: 'Conversation ID'},
            limit: {type: 'number', description: 'Number of messages'},
            offset: {type: 'number', description: 'Pagination offset'}
          },
          required: ['conversationId']
        },
        scopes: ['View Conversation Messages']
      },
      'conversations_send-a-new-message': {
        description: 'Send a message into a conversation thread',
        parameters: {
          type: 'object',
          properties: {
            conversationId: {type: 'string', description: 'Conversation ID'},
            message: {type: 'string', description: 'Message content'},
            type: {type: 'string', enum: ['SMS', 'Email', 'WhatsApp'], description: 'Message type'},
            contactId: {type: 'string', description: 'Contact ID'}
          },
          required: ['conversationId', 'message']
        },
        scopes: ['Edit Conversation Messages']
      },

      // Opportunity Management - Updated to match MCP docs
      'opportunities_search-opportunity': {
        description: 'Search for opportunities by criteria',
        parameters: {
          type: 'object',
          properties: {
            pipelineId: {type: 'string', description: 'Filter by pipeline ID'},
            status: {type: 'string', description: 'Filter by status'},
            contactId: {type: 'string', description: 'Filter by contact ID'},
            query: {type: 'string', description: 'Search query'},
            limit: {type: 'number', description: 'Number of results'},
            offset: {type: 'number', description: 'Pagination offset'},
            monetaryValue: {type: 'number', description: 'Filter by minimum value'}
          }
        },
        scopes: ['View Opportunities']
      },
      'opportunities_get-pipelines': {
        description: 'Retrieve all opportunity pipelines',
        parameters: {
          type: 'object',
          properties: {
            limit: {type: 'number', description: 'Number of results'}
          }
        },
        scopes: ['View Opportunities']
      },
      'opportunities_get-opportunity': {
        description: 'Fetch an opportunity by ID',
        parameters: {
          type: 'object',
          properties: {
            opportunityId: {type: 'string', description: 'Opportunity ID'}
          },
          required: ['opportunityId']
        },
        scopes: ['View Opportunities']
      },
      'opportunities_update-opportunity': {
        description: 'Update an existing opportunity',
        parameters: {
          type: 'object',
          properties: {
            opportunityId: {type: 'string', description: 'Opportunity ID'},
            name: {type: 'string', description: 'Opportunity name'},
            monetaryValue: {type: 'number', description: 'Opportunity value'},
            status: {type: 'string', description: 'Status'},
            stageId: {type: 'string', description: 'Stage ID'}
          },
          required: ['opportunityId']
        },
        scopes: ['Edit Opportunities']
      },

      // Location Management - Updated to match MCP docs
      'locations_get-location': {
        description: 'Get sub-account (location) details by ID',
        parameters: {
          type: 'object',
          properties: {
            locationId: {type: 'string', description: 'Location ID'}
          }
        },
        scopes: ['View Locations']
      },
      'locations_get-custom-fields': {
        description: 'Retrieve custom field definitions for a location',
        parameters: {
          type: 'object',
          properties: {
            locationId: {type: 'string', description: 'Location ID'},
            objectType: {type: 'string', description: 'Object type (contact, opportunity, etc.)'}
          }
        },
        scopes: ['View Custom Fields']
      },

      // Payment Management - Updated to match MCP docs
      'payments_get-order-by-id': {
        description: 'Fetch order details by unique order ID',
        parameters: {
          type: 'object',
          properties: {
            orderId: {type: 'string', description: 'Order ID'}
          },
          required: ['orderId']
        },
        scopes: ['View Payment Orders']
      },
      'payments_list-transactions': {
        description: 'Paginated list, supports filtering',
        parameters: {
          type: 'object',
          properties: {
            contactId: {type: 'string', description: 'Filter by contact ID'},
            startDate: {type: 'string', description: 'Start date filter'},
            endDate: {type: 'string', description: 'End date filter'},
            limit: {type: 'number', description: 'Number of results'},
            offset: {type: 'number', description: 'Pagination offset'},
            status: {type: 'string', description: 'Transaction status'}
          }
        },
        scopes: ['View Payment Transactions']
      }
    };
  }

  getHeaders(config) {
    if (!config.ghlToken) {
      throw new Error('GHL Token is required');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${config.ghlToken}`
    };

    // Add locationId header if provided
    if (config.locationId) {
      headers['locationId'] = config.locationId;
    }

    return headers;
  }

  async makeRequest(toolName, params = {}, config) {
    try {
      const url = GHL_MCP_URL;
      const headers = this.getHeaders(config);

      debugService.log('Making MCP request', {
        toolName,
        params,
        url,
        headers: { ...headers, Authorization: '[REDACTED]' }
      });

      // Enhanced MCP request format with better error handling
      const mcpRequest = {
        method: 'POST',
        url,
        headers,
        data: {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: params
          }
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      };

      debugService.log('Full MCP request payload', {
        ...mcpRequest,
        headers: { ...mcpRequest.headers, Authorization: '[REDACTED]' }
      });

      const response = await axios(mcpRequest);

      debugService.log('MCP response received', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : null
      });

      if (response.status >= 200 && response.status < 300) {
        // Handle both direct result and JSON-RPC response format
        if (response.data.result !== undefined) {
          return response.data.result;
        } else if (response.data.error) {
          // Enhanced MCP-specific error handling
          const mcpError = response.data.error;
          if (mcpError.code === -32601) {
            throw new Error(`MCP method not found: ${toolName}. Please check the tool name matches the MCP documentation.`);
          } else if (mcpError.code === -32602) {
            throw new Error(`Invalid MCP parameters for ${toolName}: ${mcpError.message}`);
          } else if (mcpError.code === -32603) {
            throw new Error(`MCP internal error: ${mcpError.message}`);
          } else if (mcpError.code === -32700) {
            throw new Error('MCP parse error: Invalid JSON-RPC request');
          } else {
            throw new Error(`MCP Error ${mcpError.code}: ${mcpError.message || 'Unknown MCP error'}`);
          }
        } else {
          return response.data;
        }
      } else if (response.status === 401) {
        throw new Error('MCP Authentication failed. Please check your GHL Private Integration Token.');
      } else if (response.status === 403) {
        const endpoint = this.endpoints[toolName];
        const requiredScopes = endpoint ? endpoint.scopes.join(', ') : 'unknown';
        throw new Error(`MCP Access denied. Required scopes: ${requiredScopes}. Please check your token permissions.`);
      } else if (response.status === 404) {
        throw new Error(`MCP Resource not found. Tool '${toolName}' may not exist or parameters are invalid.`);
      } else if (response.status === 429) {
        throw new Error('MCP Rate limit exceeded. Please wait before making more requests.');
      } else if (response.status === 400) {
        throw new Error(`MCP Bad Request: Invalid parameters for ${toolName}. Please check the documentation.`);
      }

      throw new Error(`MCP returned unexpected status: ${response.status}`);

    } catch (error) {
      debugService.error('MCP request failed', error);

      if (error.response) {
        const errorData = error.response.data;
        debugService.error('MCP error response', errorData);

        let errorMsg = 'Unknown MCP error';
        
        // Enhanced MCP-specific error handling
        if (errorData?.error?.message) {
          errorMsg = errorData.error.message;
        } else if (errorData?.message) {
          errorMsg = errorData.message;
        } else if (error.response.statusText) {
          errorMsg = error.response.statusText;
        }

        // Add context about MCP endpoint
        if (error.response.status === 404) {
          errorMsg += ` (MCP Endpoint: ${GHL_MCP_URL}, Tool: ${toolName})`;
        }

        throw new Error(`GHL MCP Error ${error.response.status}: ${errorMsg}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('MCP request timeout. The GHL MCP server may be experiencing delays.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`MCP network error. Cannot reach ${GHL_MCP_URL}. Please check your connection.`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`MCP connection refused. The GHL MCP server may be unavailable.`);
      }

      throw error;
    }
  }

  async executeAction(toolCall, config) {
    const { name, parameters } = toolCall;
    
    try {
      debugService.log(`Executing MCP tool ${name}`, parameters);

      // Validate tool exists
      const endpoint = this.endpoints[name];
      if (!endpoint) {
        throw new Error(`Unknown MCP tool: ${name}. Available tools: ${Object.keys(this.endpoints).join(', ')}`);
      }

      // Add intelligent parameter defaults
      const enhancedParams = this.enhanceParameters(name, parameters);
      
      const result = await this.makeRequest(name, enhancedParams, config);

      debugService.log(`MCP tool ${name} completed successfully`, {
        resultType: typeof result,
        resultKeys: typeof result === 'object' ? Object.keys(result) : null
      });

      return result;

    } catch (error) {
      debugService.error(`Error executing MCP tool ${name}`, error);
      throw error;
    }
  }

  enhanceParameters(toolName, parameters) {
    const enhanced = { ...parameters };

    // Add intelligent defaults based on tool type
    if (toolName.includes('get-') || toolName.includes('search-')) {
      if (!enhanced.limit) {
        enhanced.limit = 50; // Default limit for search operations
      }
      if (!enhanced.offset) {
        enhanced.offset = 0; // Default offset
      }
    }

    // Add date formatting for calendar operations
    if (toolName.includes('calendars_') && enhanced.startDate) {
      enhanced.startDate = new Date(enhanced.startDate).toISOString();
    }
    if (toolName.includes('calendars_') && enhanced.endDate) {
      enhanced.endDate = new Date(enhanced.endDate).toISOString();
    }

    return enhanced;
  }

  async testConnection(config) {
    try {
      debugService.log('Testing MCP connection');
      
      // Test with a simple location info request
      const result = await this.makeRequest('locations_get-location', {}, config);
      
      debugService.log('MCP connection test successful', result);
      return true;
    } catch (error) {
      debugService.error('MCP connection test failed', error);
      throw error;
    }
  }

  getAvailableTools() {
    return Object.entries(this.endpoints).map(([name, endpoint]) => ({
      name,
      description: endpoint.description,
      parameters: endpoint.parameters,
      scopes: endpoint.scopes
    }));
  }

  getRequiredScopes(toolName) {
    return this.endpoints[toolName]?.scopes || [];
  }

  // Helper method to get tools by category
  getToolsByCategory() {
    const categories = {
      contacts: [],
      conversations: [],
      opportunities: [],
      calendars: [],
      payments: [],
      locations: []
    };

    Object.entries(this.endpoints).forEach(([name, endpoint]) => {
      const category = name.split('_')[0];
      if (categories[category]) {
        categories[category].push({
          name,
          description: endpoint.description,
          scopes: endpoint.scopes
        });
      }
    });

    return categories;
  }

  // Get MCP endpoint information
  getMCPEndpointInfo() {
    return {
      url: GHL_MCP_URL,
      protocol: 'HTTP Streamable',
      documentation: 'https://services.leadconnectorhq.com/mcp/',
      totalTools: Object.keys(this.endpoints).length,
      categories: Object.keys(this.getToolsByCategory()),
      requiredHeaders: ['Authorization', 'locationId (optional)']
    };
  }
}

export const ghlService = new GHLService();