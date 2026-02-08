export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          organization_id: string
          user_id: string
          visible_to_user_ids: string[] | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          organization_id: string
          user_id: string
          visible_to_user_ids?: string[] | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          organization_id?: string
          user_id?: string
          visible_to_user_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          agent_id: string
          created_at: string | null
          error_message: string | null
          id: string
          status: string
          task_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          agent_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          status: string
          task_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          agent_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_nudge_opportunities"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "agent_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_activity_feed: {
        Row: {
          channel: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          title: string
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          title: string
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agent_identities: {
        Row: {
          boundaries: string[] | null
          communication_style: Json | null
          created_at: string | null
          greeting: string | null
          id: string
          is_active: boolean | null
          name: string
          persona: string | null
          signoff: string | null
          system_prompt_override: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          boundaries?: string[] | null
          communication_style?: Json | null
          created_at?: string | null
          greeting?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          persona?: string | null
          signoff?: string | null
          system_prompt_override?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          boundaries?: string[] | null
          communication_style?: Json | null
          created_at?: string | null
          greeting?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          persona?: string | null
          signoff?: string | null
          system_prompt_override?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_plans: {
        Row: {
          completed_at: string | null
          context: Json | null
          created_at: string | null
          current_step_index: number | null
          error_message: string | null
          execution_model: string | null
          goal: string
          id: string
          planning_model: string | null
          status: string | null
          step_results: Json | null
          steps: Json | null
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          current_step_index?: number | null
          error_message?: string | null
          execution_model?: string | null
          goal: string
          id?: string
          planning_model?: string | null
          status?: string | null
          step_results?: Json | null
          steps?: Json | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          current_step_index?: number | null
          error_message?: string | null
          execution_model?: string | null
          goal?: string
          id?: string
          planning_model?: string | null
          status?: string | null
          step_results?: Json | null
          steps?: Json | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          agent_type: string
          bot_type: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          failed_actions: number | null
          id: string
          instructions: string | null
          is_published: boolean | null
          last_active_at: string | null
          name: string
          organization_id: string
          personality: string | null
          successful_actions: number | null
          total_actions: number | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          bot_type?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          failed_actions?: number | null
          id?: string
          instructions?: string | null
          is_published?: boolean | null
          last_active_at?: string | null
          name: string
          organization_id: string
          personality?: string | null
          successful_actions?: number | null
          total_actions?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          bot_type?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          failed_actions?: number | null
          id?: string
          instructions?: string | null
          is_published?: boolean | null
          last_active_at?: string | null
          name?: string
          organization_id?: string
          personality?: string | null
          successful_actions?: number | null
          total_actions?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_conversations: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string | null
          id: string
          messages: Json[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          messages?: Json[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          messages?: Json[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_assistants: {
        Row: {
          advisor_type: string | null
          avatar_emoji: string | null
          capabilities: Json | null
          context_knowledge: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          example_interactions: Json | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          last_used_at: string | null
          max_tokens: number | null
          model_preference: string | null
          name: string
          organization_id: string
          personality_traits: Json | null
          role: string
          system_instructions: string
          team_id: string | null
          temperature: number | null
          tone: string | null
          tools_enabled: Json | null
          total_conversations: number | null
          total_messages: number | null
          updated_at: string | null
          user_id: string
          verbosity: string | null
        }
        Insert: {
          advisor_type?: string | null
          avatar_emoji?: string | null
          capabilities?: Json | null
          context_knowledge?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          example_interactions?: Json | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          max_tokens?: number | null
          model_preference?: string | null
          name: string
          organization_id: string
          personality_traits?: Json | null
          role: string
          system_instructions: string
          team_id?: string | null
          temperature?: number | null
          tone?: string | null
          tools_enabled?: Json | null
          total_conversations?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_id: string
          verbosity?: string | null
        }
        Update: {
          advisor_type?: string | null
          avatar_emoji?: string | null
          capabilities?: Json | null
          context_knowledge?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          example_interactions?: Json | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          max_tokens?: number | null
          model_preference?: string | null
          name?: string
          organization_id?: string
          personality_traits?: Json | null
          role?: string
          system_instructions?: string
          team_id?: string | null
          temperature?: number | null
          tone?: string | null
          tools_enabled?: Json | null
          total_conversations?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_id?: string
          verbosity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_assistants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          category: string | null
          confidence_score: number | null
          context_tags: string[] | null
          created_at: string | null
          description: string
          evidence: Json | null
          frequency_count: number | null
          id: string
          insight_type: string
          key_findings: Json | null
          last_seen_at: string | null
          metadata: Json | null
          organization_id: string
          related_conversations: string[] | null
          related_documents: string[] | null
          related_insights: string[] | null
          relevance_score: number | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          description: string
          evidence?: Json | null
          frequency_count?: number | null
          id?: string
          insight_type: string
          key_findings?: Json | null
          last_seen_at?: string | null
          metadata?: Json | null
          organization_id: string
          related_conversations?: string[] | null
          related_documents?: string[] | null
          related_insights?: string[] | null
          relevance_score?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          description?: string
          evidence?: Json | null
          frequency_count?: number | null
          id?: string
          insight_type?: string
          key_findings?: Json | null
          last_seen_at?: string | null
          metadata?: Json | null
          organization_id?: string
          related_conversations?: string[] | null
          related_documents?: string[] | null
          related_insights?: string[] | null
          relevance_score?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          memory_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          memory_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          memory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_log_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "user_ai_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_pricing: {
        Row: {
          context_window: number | null
          created_at: string | null
          display_name: string
          id: string
          input_cost_per_1k: number
          is_active: boolean | null
          is_premium: boolean | null
          model_id: string
          output_cost_per_1k: number
          overage_multiplier: number | null
          provider: string
          supports_function_calling: boolean | null
          supports_vision: boolean | null
          tier_required: string | null
          updated_at: string | null
        }
        Insert: {
          context_window?: number | null
          created_at?: string | null
          display_name: string
          id?: string
          input_cost_per_1k: number
          is_active?: boolean | null
          is_premium?: boolean | null
          model_id: string
          output_cost_per_1k: number
          overage_multiplier?: number | null
          provider: string
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
          tier_required?: string | null
          updated_at?: string | null
        }
        Update: {
          context_window?: number | null
          created_at?: string | null
          display_name?: string
          id?: string
          input_cost_per_1k?: number
          is_active?: boolean | null
          is_premium?: boolean | null
          model_id?: string
          output_cost_per_1k?: number
          overage_multiplier?: number | null
          provider?: string
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
          tier_required?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_processing_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          max_attempts: number | null
          output_data: Json | null
          priority: number | null
          scheduled_for: string | null
          source_id: string | null
          source_type: string | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          max_attempts?: number | null
          output_data?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          max_attempts?: number | null
          output_data?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          context_id: string | null
          context_type: string | null
          cost_cents: number | null
          created_at: string | null
          feature: string
          id: string
          input_tokens: number | null
          model: string
          org_id: string | null
          output_tokens: number | null
          provider: string
          response_time_ms: number | null
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          cost_cents?: number | null
          created_at?: string | null
          feature: string
          id?: string
          input_tokens?: number | null
          model: string
          org_id?: string | null
          output_tokens?: number | null
          provider: string
          response_time_ms?: number | null
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          cost_cents?: number | null
          created_at?: string | null
          feature?: string
          id?: string
          input_tokens?: number | null
          model?: string
          org_id?: string | null
          output_tokens?: number | null
          provider?: string
          response_time_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          scopes: string[]
          total_requests: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          scopes?: string[]
          total_requests?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          scopes?: string[]
          total_requests?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_scopes: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          name: string
          required_tier: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          name: string
          required_tier?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          name?: string
          required_tier?: string | null
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          api_key_id: string
          cost_usd: number | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          organization_id: string
          request_id: string | null
          response_status: number | null
          response_time_ms: number | null
          tokens_used: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          cost_usd?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          organization_id: string
          request_id?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          tokens_used?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          cost_usd?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          organization_id?: string
          request_id?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          tokens_used?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_connections: {
        Row: {
          api_key_hash: string | null
          api_key_prefix: string | null
          app_description: string | null
          app_name: string
          app_slug: string
          app_url: string | null
          created_at: string | null
          events_enabled: boolean | null
          id: string
          is_active: boolean | null
          last_event_at: string | null
          last_sync_at: string | null
          owner_entity_id: string | null
          people_sync_enabled: boolean | null
          settings: Json | null
          transaction_tracking_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_key_hash?: string | null
          api_key_prefix?: string | null
          app_description?: string | null
          app_name: string
          app_slug: string
          app_url?: string | null
          created_at?: string | null
          events_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_event_at?: string | null
          last_sync_at?: string | null
          owner_entity_id?: string | null
          people_sync_enabled?: boolean | null
          settings?: Json | null
          transaction_tracking_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_key_hash?: string | null
          api_key_prefix?: string | null
          app_description?: string | null
          app_name?: string
          app_slug?: string
          app_url?: string | null
          created_at?: string | null
          events_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_event_at?: string | null
          last_sync_at?: string | null
          owner_entity_id?: string | null
          people_sync_enabled?: boolean | null
          settings?: Json | null
          transaction_tracking_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_connections_owner_entity_id_fkey"
            columns: ["owner_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          assistant_id: string
          context_data: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          organization_id: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id: string
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          organization_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          organization_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          feedback: string | null
          id: string
          metadata: Json | null
          organization_id: string
          rating: number | null
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          rating?: number | null
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          rating?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_role_templates: {
        Row: {
          avatar_emoji: string | null
          category: string | null
          created_at: string | null
          default_capabilities: Json | null
          default_instructions: string
          default_personality: Json | null
          default_tone: string | null
          default_verbosity: string | null
          description: string | null
          example_prompts: Json | null
          id: string
          is_popular: boolean | null
          name: string
          role: string
          usage_count: number | null
          use_cases: Json | null
        }
        Insert: {
          avatar_emoji?: string | null
          category?: string | null
          created_at?: string | null
          default_capabilities?: Json | null
          default_instructions: string
          default_personality?: Json | null
          default_tone?: string | null
          default_verbosity?: string | null
          description?: string | null
          example_prompts?: Json | null
          id?: string
          is_popular?: boolean | null
          name: string
          role: string
          usage_count?: number | null
          use_cases?: Json | null
        }
        Update: {
          avatar_emoji?: string | null
          category?: string | null
          created_at?: string | null
          default_capabilities?: Json | null
          default_instructions?: string
          default_personality?: Json | null
          default_tone?: string | null
          default_verbosity?: string | null
          description?: string | null
          example_prompts?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          role?: string
          usage_count?: number | null
          use_cases?: Json | null
        }
        Relationships: []
      }
      attention_items: {
        Row: {
          ai_priority_score: number | null
          created_at: string | null
          due_at: string | null
          id: string
          is_archived: boolean | null
          is_resolved: boolean | null
          metadata: Json | null
          preview: string | null
          source_id: string
          source_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_priority_score?: number | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_resolved?: boolean | null
          metadata?: Json | null
          preview?: string | null
          source_id: string
          source_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_priority_score?: number | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_resolved?: boolean | null
          metadata?: Json | null
          preview?: string | null
          source_id?: string
          source_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          automation_id: string
          automation_type: string
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          automation_id: string
          automation_type: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status: string
          summary?: string | null
          user_id: string
        }
        Update: {
          automation_id?: string
          automation_type?: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action: string | null
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_summary: string | null
          metadata: Json | null
          output_summary: string | null
          source_id: string | null
          source_type: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
          workflow_id: string | null
          workflow_name: string
          workflow_type: string | null
        }
        Insert: {
          action?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_summary?: string | null
          metadata?: Json | null
          output_summary?: string | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
          workflow_id?: string | null
          workflow_name: string
          workflow_type?: string | null
        }
        Update: {
          action?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_summary?: string | null
          metadata?: Json | null
          output_summary?: string | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
          workflow_id?: string | null
          workflow_name?: string
          workflow_type?: string | null
        }
        Relationships: []
      }
      automation_queue: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          created_at: string | null
          entity_id: string | null
          error_message: string | null
          id: string
          job_type: string
          max_retries: number | null
          metadata: Json | null
          owner_id: string | null
          payload: Json
          priority: number | null
          project_id: string | null
          result: Json | null
          retry_count: number | null
          scheduled_for: string | null
          source: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_retries?: number | null
          metadata?: Json | null
          owner_id?: string | null
          payload?: Json
          priority?: number | null
          project_id?: string | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          source?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number | null
          metadata?: Json | null
          owner_id?: string | null
          payload?: Json
          priority?: number | null
          project_id?: string | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          source?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_queue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "entity_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_triggers: {
        Row: {
          automation_id: string
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_count: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_id: string
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          trigger_count?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_id?: string
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_count?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      beta_access: {
        Row: {
          expires_at: string | null
          feature_id: string
          granted_at: string | null
          id: string
          invited_by: string | null
          notes: string | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          feature_id: string
          granted_at?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          feature_id?: string
          granted_at?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_access_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_code: string
          invited_by: string | null
          organization_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_code: string
          invited_by?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_code?: string
          invited_by?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invite_codes: {
        Row: {
          beta_tier: string
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          invited_email: string | null
          max_uses: number | null
          notes: string | null
          updated_at: string | null
          uses_count: number | null
        }
        Insert: {
          beta_tier?: string
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          invited_email?: string | null
          max_uses?: number | null
          notes?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Update: {
          beta_tier?: string
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          invited_email?: string | null
          max_uses?: number | null
          notes?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "beta_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_senders: {
        Row: {
          block_type: string
          blocked_count: number | null
          created_at: string | null
          id: string
          organization_id: string
          reason: string | null
          user_id: string
          value: string
        }
        Insert: {
          block_type?: string
          blocked_count?: number | null
          created_at?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          user_id: string
          value: string
        }
        Update: {
          block_type?: string
          blocked_count?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_senders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_edges: {
        Row: {
          agent_id: string
          condition: Json | null
          created_at: string | null
          edge_id: string
          id: string
          label: string | null
          source_handle: string | null
          source_node_id: string
          target_handle: string | null
          target_node_id: string
        }
        Insert: {
          agent_id: string
          condition?: Json | null
          created_at?: string | null
          edge_id: string
          id?: string
          label?: string | null
          source_handle?: string | null
          source_node_id: string
          target_handle?: string | null
          target_node_id: string
        }
        Update: {
          agent_id?: string
          condition?: Json | null
          created_at?: string | null
          edge_id?: string
          id?: string
          label?: string | null
          source_handle?: string | null
          source_node_id?: string
          target_handle?: string | null
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_edges_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_executions: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string | null
          current_node_id: string | null
          error_message: string | null
          execution_log: Json | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          organization_id: string
          output_data: Json | null
          started_at: string | null
          status: string
          trigger_data: Json | null
          triggered_by: string
          triggered_by_user: string | null
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string | null
          error_message?: string | null
          execution_log?: Json | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          organization_id: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          trigger_data?: Json | null
          triggered_by?: string
          triggered_by_user?: string | null
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string | null
          error_message?: string | null
          execution_log?: Json | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          organization_id?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          trigger_data?: Json | null
          triggered_by?: string
          triggered_by_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_installations: {
        Row: {
          custom_config: Json | null
          id: string
          installed_agent_id: string | null
          installed_at: string | null
          installed_by: string | null
          is_active: boolean | null
          marketplace_id: string
          organization_id: string
          purchase_amount: number | null
          stripe_payment_id: string | null
        }
        Insert: {
          custom_config?: Json | null
          id?: string
          installed_agent_id?: string | null
          installed_at?: string | null
          installed_by?: string | null
          is_active?: boolean | null
          marketplace_id: string
          organization_id: string
          purchase_amount?: number | null
          stripe_payment_id?: string | null
        }
        Update: {
          custom_config?: Json | null
          id?: string
          installed_agent_id?: string | null
          installed_at?: string | null
          installed_by?: string | null
          is_active?: boolean | null
          marketplace_id?: string
          organization_id?: string
          purchase_amount?: number | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_installations_installed_agent_id_fkey"
            columns: ["installed_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_installations_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "bot_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_installations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_marketplace: {
        Row: {
          agent_id: string
          approved_at: string | null
          approved_by: string | null
          author_name: string | null
          author_org_id: string | null
          author_verified: boolean | null
          category: string
          created_at: string | null
          demo_video_url: string | null
          description: string | null
          icon: string | null
          id: string
          install_count: number | null
          is_active: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_free: boolean | null
          name: string
          preview_image_url: string | null
          price: number | null
          rating: number | null
          rating_count: number | null
          rejection_reason: string | null
          screenshots: string[] | null
          short_description: string | null
          stripe_price_id: string | null
          submitted_at: string | null
          tags: string[] | null
          updated_at: string | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          agent_id: string
          approved_at?: string | null
          approved_by?: string | null
          author_name?: string | null
          author_org_id?: string | null
          author_verified?: boolean | null
          category?: string
          created_at?: string | null
          demo_video_url?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          name: string
          preview_image_url?: string | null
          price?: number | null
          rating?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          screenshots?: string[] | null
          short_description?: string | null
          stripe_price_id?: string | null
          submitted_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          agent_id?: string
          approved_at?: string | null
          approved_by?: string | null
          author_name?: string | null
          author_org_id?: string | null
          author_verified?: boolean | null
          category?: string
          created_at?: string | null
          demo_video_url?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          name?: string
          preview_image_url?: string | null
          price?: number | null
          rating?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          screenshots?: string[] | null
          short_description?: string | null
          stripe_price_id?: string | null
          submitted_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_marketplace_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_marketplace_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_node_types: {
        Row: {
          category: string
          color: string | null
          config_schema: Json | null
          created_at: string | null
          description: string | null
          handles: Json | null
          icon: string | null
          id: string
          input_schema: Json | null
          is_active: boolean | null
          name: string
          output_schema: Json | null
          required_tier: string | null
          type_id: string
        }
        Insert: {
          category: string
          color?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          handles?: Json | null
          icon?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          name: string
          output_schema?: Json | null
          required_tier?: string | null
          type_id: string
        }
        Update: {
          category?: string
          color?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          handles?: Json | null
          icon?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          name?: string
          output_schema?: Json | null
          required_tier?: string | null
          type_id?: string
        }
        Relationships: []
      }
      bot_nodes: {
        Row: {
          agent_id: string
          config: Json | null
          created_at: string | null
          id: string
          label: string | null
          node_id: string
          node_type: string
          position_x: number | null
          position_y: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          config?: Json | null
          created_at?: string | null
          id?: string
          label?: string | null
          node_id: string
          node_type: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          label?: string | null
          node_id?: string
          node_type?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_nodes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          marketplace_id: string
          organization_id: string
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          marketplace_id: string
          organization_id: string
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          marketplace_id?: string
          organization_id?: string
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_reviews_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "bot_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_platforms: {
        Row: {
          account_handle: string | null
          account_id: string | null
          brand_id: string
          created_at: string | null
          credentials_id: string | null
          id: string
          is_active: boolean | null
          is_connected: boolean | null
          max_posts_per_day: number | null
          min_hours_between_posts: number | null
          platform_id: string
          tone_overrides: Json | null
        }
        Insert: {
          account_handle?: string | null
          account_id?: string | null
          brand_id: string
          created_at?: string | null
          credentials_id?: string | null
          id?: string
          is_active?: boolean | null
          is_connected?: boolean | null
          max_posts_per_day?: number | null
          min_hours_between_posts?: number | null
          platform_id: string
          tone_overrides?: Json | null
        }
        Update: {
          account_handle?: string | null
          account_id?: string | null
          brand_id?: string
          created_at?: string | null
          credentials_id?: string | null
          id?: string
          is_active?: boolean | null
          is_connected?: boolean | null
          max_posts_per_day?: number | null
          min_hours_between_posts?: number | null
          platform_id?: string
          tone_overrides?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_platforms_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_platforms_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "lookup_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          approval_required: boolean | null
          auto_schedule_enabled: boolean | null
          color_primary: string | null
          color_secondary: string | null
          content_calendar_enabled: boolean | null
          created_at: string | null
          description: string | null
          entity_id: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          optimal_times: Json | null
          owner_id: string
          posting_frequency: Json | null
          primary_ai_model: string | null
          refinement_ai_model: string | null
          social_accounts: Json | null
          tagline: string | null
          tone_config: Json | null
          updated_at: string | null
        }
        Insert: {
          approval_required?: boolean | null
          auto_schedule_enabled?: boolean | null
          color_primary?: string | null
          color_secondary?: string | null
          content_calendar_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          entity_id: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          optimal_times?: Json | null
          owner_id: string
          posting_frequency?: Json | null
          primary_ai_model?: string | null
          refinement_ai_model?: string | null
          social_accounts?: Json | null
          tagline?: string | null
          tone_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          approval_required?: boolean | null
          auto_schedule_enabled?: boolean | null
          color_primary?: string | null
          color_secondary?: string | null
          content_calendar_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          entity_id?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          optimal_times?: Json | null
          owner_id?: string
          posting_frequency?: Json | null
          primary_ai_model?: string | null
          refinement_ai_model?: string | null
          social_accounts?: Json | null
          tagline?: string | null
          tone_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_cache: {
        Row: {
          briefing_date: string
          data: Json
          generated_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          briefing_date: string
          data: Json
          generated_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          briefing_date?: string
          data?: Json
          generated_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      briefing_history: {
        Row: {
          briefing_content: Json | null
          briefing_data: Json | null
          channel: string
          created_at: string | null
          delivered: boolean | null
          delivered_at: string | null
          id: string
          opened_at: string | null
          user_id: string
        }
        Insert: {
          briefing_content?: Json | null
          briefing_data?: Json | null
          channel: string
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          user_id: string
        }
        Update: {
          briefing_content?: Json | null
          briefing_data?: Json | null
          channel?: string
          created_at?: string | null
          delivered?: boolean | null
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      browser_sessions: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          result_size_bytes: number | null
          result_type: string | null
          status: string | null
          timing_ms: number | null
          url: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          result_size_bytes?: number | null
          result_type?: string | null
          status?: string | null
          timing_ms?: number | null
          url: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          result_size_bytes?: number | null
          result_type?: string | null
          status?: string | null
          timing_ms?: number | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string | null
          description: string | null
          end_time: string
          google_event_id: string | null
          id: string
          location: string | null
          organization_id: string
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string | null
          description?: string | null
          end_time: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          organization_id: string
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          notification_pref: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notification_pref?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notification_pref?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          attachments: Json | null
          channel_message_id: string | null
          channel_type: string
          channel_user_id: string | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          direction: string
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_message_id?: string | null
          channel_type: string
          channel_user_id?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_message_id?: string | null
          channel_type?: string
          channel_user_id?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          is_private: boolean | null
          name: string | null
          org_id: string
          project_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_private?: boolean | null
          name?: string | null
          org_id: string
          project_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_private?: boolean | null
          name?: string | null
          org_id?: string
          project_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_model: string | null
          attachments: Json | null
          channel_id: string
          content: string
          content_html: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_ai: boolean | null
          is_deleted: boolean | null
          is_edited: boolean | null
          mentions: Json | null
          parent_id: string | null
          reaction_counts: Json | null
          thread_count: number | null
          user_id: string | null
        }
        Insert: {
          ai_model?: string | null
          attachments?: Json | null
          channel_id: string
          content: string
          content_html?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_ai?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mentions?: Json | null
          parent_id?: string | null
          reaction_counts?: Json | null
          thread_count?: number | null
          user_id?: string | null
        }
        Update: {
          ai_model?: string | null
          attachments?: Json | null
          channel_id?: string
          content?: string
          content_html?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_ai?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mentions?: Json | null
          parent_id?: string | null
          reaction_counts?: Json | null
          thread_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_action_items: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          session_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_action_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coaching_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_action_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_clients: {
        Row: {
          ai_summary: string | null
          coaching_type: string | null
          company: string | null
          contact_id: string | null
          created_at: string | null
          email: string | null
          engagement_end: string | null
          engagement_start: string | null
          goals: string | null
          id: string
          name: string
          notes: string | null
          package_type: string | null
          phone: string | null
          primary_goals: string[] | null
          rate_amount: number | null
          rate_type: string | null
          role: string | null
          session_duration_minutes: number | null
          session_frequency: string | null
          status: string | null
          success_metrics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          coaching_type?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          engagement_end?: string | null
          engagement_start?: string | null
          goals?: string | null
          id?: string
          name: string
          notes?: string | null
          package_type?: string | null
          phone?: string | null
          primary_goals?: string[] | null
          rate_amount?: number | null
          rate_type?: string | null
          role?: string | null
          session_duration_minutes?: number | null
          session_frequency?: string | null
          status?: string | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          coaching_type?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          engagement_end?: string | null
          engagement_start?: string | null
          goals?: string | null
          id?: string
          name?: string
          notes?: string | null
          package_type?: string | null
          phone?: string | null
          primary_goals?: string[] | null
          rate_amount?: number | null
          rate_type?: string | null
          role?: string | null
          session_duration_minutes?: number | null
          session_frequency?: string | null
          status?: string | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          action_items: Json | null
          ai_recommendations: Json | null
          ai_summary: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          follow_up_required: boolean | null
          goals_for_session: string[] | null
          homework_assigned: string | null
          id: string
          key_insights: string | null
          next_session_focus: string | null
          notes: string | null
          prep_notes: string | null
          scheduled_at: string
          session_number: number | null
          session_type: string | null
          status: string | null
          summary: string | null
          topics_covered: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          ai_recommendations?: Json | null
          ai_summary?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean | null
          goals_for_session?: string[] | null
          homework_assigned?: string | null
          id?: string
          key_insights?: string | null
          next_session_focus?: string | null
          notes?: string | null
          prep_notes?: string | null
          scheduled_at: string
          session_number?: number | null
          session_type?: string | null
          status?: string | null
          summary?: string | null
          topics_covered?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: Json | null
          ai_recommendations?: Json | null
          ai_summary?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean | null
          goals_for_session?: string[] | null
          homework_assigned?: string | null
          id?: string
          key_insights?: string | null
          next_session_focus?: string | null
          notes?: string | null
          prep_notes?: string | null
          scheduled_at?: string
          session_number?: number | null
          session_type?: string | null
          status?: string | null
          summary?: string | null
          topics_covered?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coaching_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      code_executions: {
        Row: {
          code: string
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          exit_code: number | null
          id: string
          language: string
          metadata: Json | null
          organization_id: string | null
          sandbox_id: string | null
          status: string | null
          stderr: string | null
          stdout: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          exit_code?: number | null
          id?: string
          language: string
          metadata?: Json | null
          organization_id?: string | null
          sandbox_id?: string | null
          status?: string | null
          stderr?: string | null
          stdout?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          exit_code?: number | null
          id?: string
          language?: string
          metadata?: Json | null
          organization_id?: string | null
          sandbox_id?: string | null
          status?: string | null
          stderr?: string | null
          stdout?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "code_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          mentioned_user_ids: string[] | null
          mentions: Json | null
          org_id: string | null
          organization_id: string
          parent_comment_id: string | null
          parent_id: string | null
          reaction_counts: Json | null
          reactions: Json | null
          thread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mentioned_user_ids?: string[] | null
          mentions?: Json | null
          org_id?: string | null
          organization_id: string
          parent_comment_id?: string | null
          parent_id?: string | null
          reaction_counts?: Json | null
          reactions?: Json | null
          thread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mentioned_user_ids?: string[] | null
          mentions?: Json | null
          org_id?: string | null
          organization_id?: string
          parent_comment_id?: string | null
          parent_id?: string | null
          reaction_counts?: Json | null
          reactions?: Json | null
          thread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_extractions: {
        Row: {
          commitments_data: Json | null
          commitments_found: number | null
          conversation_id: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          commitments_data?: Json | null
          commitments_found?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          commitments_data?: Json | null
          commitments_found?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commitment_extractions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitment_extractions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      common_spam_domains: {
        Row: {
          category: string | null
          domain: string
          id: number
          severity: string | null
        }
        Insert: {
          category?: string | null
          domain: string
          id?: number
          severity?: string | null
        }
        Update: {
          category?: string | null
          domain?: string
          id?: number
          severity?: string | null
        }
        Relationships: []
      }
      competitors: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          name: string | null
          recent_news: Json | null
          status: string | null
          strengths: Json | null
          updated_at: string | null
          user_id: string | null
          weaknesses: Json | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name?: string | null
          recent_news?: Json | null
          status?: string | null
          strengths?: Json | null
          updated_at?: string | null
          user_id?: string | null
          weaknesses?: Json | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name?: string | null
          recent_news?: Json | null
          status?: string | null
          strengths?: Json | null
          updated_at?: string | null
          user_id?: string | null
          weaknesses?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          company_name: string | null
          company_size: string | null
          completed_at: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          referrer: string | null
          scheduled_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          company_name?: string | null
          company_size?: string | null
          completed_at?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          referrer?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          company_name?: string | null
          company_size?: string | null
          completed_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          referrer?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_app_crosswalk: {
        Row: {
          app_slug: string
          contact_id: string
          created_at: string | null
          external_data: Json | null
          external_email: string | null
          external_user_id: string
          id: string
          last_synced_at: string | null
          sync_direction: string | null
          updated_at: string | null
        }
        Insert: {
          app_slug: string
          contact_id: string
          created_at?: string | null
          external_data?: Json | null
          external_email?: string | null
          external_user_id: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          updated_at?: string | null
        }
        Update: {
          app_slug?: string
          contact_id?: string
          created_at?: string | null
          external_data?: Json | null
          external_email?: string | null
          external_user_id?: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_app_crosswalk_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "app_connections"
            referencedColumns: ["app_slug"]
          },
          {
            foreignKeyName: "contact_app_crosswalk_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "ecosystem_overview"
            referencedColumns: ["app_slug"]
          },
          {
            foreignKeyName: "contact_app_crosswalk_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_connections: {
        Row: {
          contact_a_id: string
          contact_b_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          relationship_type: string | null
          strength: string | null
        }
        Insert: {
          contact_a_id: string
          contact_b_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          relationship_type?: string | null
          strength?: string | null
        }
        Update: {
          contact_a_id?: string
          contact_b_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          relationship_type?: string | null
          strength?: string | null
        }
        Relationships: []
      }
      contact_ideas: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          idea_id: string
          relevance_note: string | null
          suggested_by: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          idea_id: string
          relevance_note?: string | null
          suggested_by?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          idea_id?: string
          relevance_note?: string | null
          suggested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_ideas_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interactions: {
        Row: {
          action_items: Json | null
          contact_id: string
          content: string | null
          created_at: string | null
          direction: string | null
          duration_minutes: number | null
          email_id: string | null
          id: string
          interaction_type: string
          key_topics: Json | null
          meeting_id: string | null
          metadata: Json | null
          occurred_at: string | null
          sentiment: string | null
          sentiment_score: number | null
          subject: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          contact_id: string
          content?: string | null
          created_at?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_id?: string | null
          id?: string
          interaction_type: string
          key_topics?: Json | null
          meeting_id?: string | null
          metadata?: Json | null
          occurred_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          subject?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          action_items?: Json | null
          contact_id?: string
          content?: string | null
          created_at?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_id?: string | null
          id?: string
          interaction_type?: string
          key_topics?: Json | null
          meeting_id?: string | null
          metadata?: Json | null
          occurred_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          subject?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          direction: string
          external_message_id: string | null
          external_thread_id: string | null
          id: string
          is_read: boolean | null
          user_id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          direction: string
          external_message_id?: string | null
          external_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          user_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          direction?: string
          external_message_id?: string | null
          external_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      contact_notes: {
        Row: {
          ai_generated: boolean | null
          contact_id: string
          content: string
          created_at: string | null
          id: string
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          contact_id: string
          content: string
          created_at?: string | null
          id?: string
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          contact_id?: string
          content?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_opportunities: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          role: string | null
          work_item_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          work_item_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_opportunities_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_projects: {
        Row: {
          added_at: string | null
          added_by: string | null
          contact_id: string
          id: string
          notes: string | null
          project_id: string
          role: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          contact_id: string
          id?: string
          notes?: string | null
          project_id: string
          role?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          contact_id?: string
          id?: string
          notes?: string | null
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ai_enriched: boolean | null
          ai_insights: Json | null
          ai_summary: string | null
          avatar_url: string | null
          background: Json | null
          became_customer_date: string | null
          best_time_to_contact: string | null
          bio: string | null
          birthday: string | null
          churned_date: string | null
          city: string | null
          communication_frequency: string | null
          company: string | null
          company_size: string | null
          company_website: string | null
          contact_type: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          department: string | null
          do_not_contact: boolean | null
          email: string | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_source: string | null
          facebook_url: string | null
          first_contact_date: string | null
          first_name: string
          follow_up_date: string | null
          followup_notes: string | null
          full_name: string | null
          github_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          interests: Json | null
          is_archived: boolean | null
          is_favorite: boolean | null
          job_title: string | null
          last_contacted_at: string | null
          last_interaction_at: string | null
          last_interaction_type: string | null
          last_name: string | null
          lead_score: number | null
          lead_status: string | null
          lifetime_value: number | null
          linkedin_url: string | null
          mutual_connections: Json | null
          name: string | null
          next_followup_date: string | null
          notes: string | null
          personal_website: string | null
          personality_traits: Json | null
          phone: string | null
          preferred_contact_method: string | null
          referred_by: string | null
          relationship_status: string | null
          relationship_strength: number | null
          source: string | null
          source_details: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          timezone: string | null
          title: string | null
          total_interactions: number | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_enriched?: boolean | null
          ai_insights?: Json | null
          ai_summary?: string | null
          avatar_url?: string | null
          background?: Json | null
          became_customer_date?: string | null
          best_time_to_contact?: string | null
          bio?: string | null
          birthday?: string | null
          churned_date?: string | null
          city?: string | null
          communication_frequency?: string | null
          company?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          department?: string | null
          do_not_contact?: boolean | null
          email?: string | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          facebook_url?: string | null
          first_contact_date?: string | null
          first_name: string
          follow_up_date?: string | null
          followup_notes?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          interests?: Json | null
          is_archived?: boolean | null
          is_favorite?: boolean | null
          job_title?: string | null
          last_contacted_at?: string | null
          last_interaction_at?: string | null
          last_interaction_type?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_status?: string | null
          lifetime_value?: number | null
          linkedin_url?: string | null
          mutual_connections?: Json | null
          name?: string | null
          next_followup_date?: string | null
          notes?: string | null
          personal_website?: string | null
          personality_traits?: Json | null
          phone?: string | null
          preferred_contact_method?: string | null
          referred_by?: string | null
          relationship_status?: string | null
          relationship_strength?: number | null
          source?: string | null
          source_details?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          title?: string | null
          total_interactions?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_enriched?: boolean | null
          ai_insights?: Json | null
          ai_summary?: string | null
          avatar_url?: string | null
          background?: Json | null
          became_customer_date?: string | null
          best_time_to_contact?: string | null
          bio?: string | null
          birthday?: string | null
          churned_date?: string | null
          city?: string | null
          communication_frequency?: string | null
          company?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          department?: string | null
          do_not_contact?: boolean | null
          email?: string | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          facebook_url?: string | null
          first_contact_date?: string | null
          first_name?: string
          follow_up_date?: string | null
          followup_notes?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          interests?: Json | null
          is_archived?: boolean | null
          is_favorite?: boolean | null
          job_title?: string | null
          last_contacted_at?: string | null
          last_interaction_at?: string | null
          last_interaction_type?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_status?: string | null
          lifetime_value?: number | null
          linkedin_url?: string | null
          mutual_connections?: Json | null
          name?: string | null
          next_followup_date?: string | null
          notes?: string | null
          personal_website?: string | null
          personality_traits?: Json | null
          phone?: string | null
          preferred_contact_method?: string | null
          referred_by?: string | null
          relationship_status?: string | null
          relationship_strength?: number | null
          source?: string | null
          source_details?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          title?: string | null
          total_interactions?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          body: string | null
          content_type: string | null
          created_at: string | null
          id: string
          platform: string | null
          status: string | null
          title: string | null
          tone: string | null
          topic: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          platform?: string | null
          status?: string | null
          title?: string | null
          tone?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          platform?: string | null
          status?: string | null
          title?: string | null
          tone?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          ai_model_used: string | null
          ai_prompt_used: string | null
          body: string
          brand_id: string
          content_type_id: string | null
          created_at: string | null
          created_by: string
          id: string
          media_urls: string[] | null
          metadata: Json | null
          performance_metrics: Json | null
          platform_versions: Json | null
          project_id: string | null
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_for: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          ai_model_used?: string | null
          ai_prompt_used?: string | null
          body: string
          brand_id: string
          content_type_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          performance_metrics?: Json | null
          platform_versions?: Json | null
          project_id?: string | null
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          ai_model_used?: string | null
          ai_prompt_used?: string | null
          body?: string
          brand_id?: string
          content_type_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          performance_metrics?: Json | null
          platform_versions?: Json | null
          project_id?: string | null
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_content_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "entity_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_publish_log: {
        Row: {
          content_id: string
          error_message: string | null
          id: string
          media_urls: string[] | null
          platform_id: string
          platform_post_id: string | null
          platform_url: string | null
          published_at: string | null
          published_content: string
          status: string
        }
        Insert: {
          content_id: string
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          platform_id: string
          platform_post_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          published_content: string
          status: string
        }
        Update: {
          content_id?: string
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          platform_id?: string
          platform_post_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          published_content?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_publish_log_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_publish_log_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "lookup_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          ai_generated: boolean | null
          ai_model: string | null
          ai_prompt: string | null
          call_to_action: string | null
          campaign_id: string | null
          content: string | null
          content_type: string
          created_at: string | null
          draft_content: string | null
          error_message: string | null
          final_content: string | null
          generation_params: Json | null
          hashtags: string[] | null
          hook: string | null
          id: string
          media_urls: string[] | null
          meeting_id: string | null
          mentions: string[] | null
          metrics: Json | null
          n8n_workflow_id: string | null
          platform: string | null
          publish_url: string | null
          published_at: string | null
          research_id: string | null
          scheduled_for: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          content?: string | null
          content_type: string
          created_at?: string | null
          draft_content?: string | null
          error_message?: string | null
          final_content?: string | null
          generation_params?: Json | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          media_urls?: string[] | null
          meeting_id?: string | null
          mentions?: string[] | null
          metrics?: Json | null
          n8n_workflow_id?: string | null
          platform?: string | null
          publish_url?: string | null
          published_at?: string | null
          research_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string | null
          draft_content?: string | null
          error_message?: string | null
          final_content?: string | null
          generation_params?: Json | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          media_urls?: string[] | null
          meeting_id?: string | null
          mentions?: string[] | null
          metrics?: Json | null
          n8n_workflow_id?: string | null
          platform?: string | null
          publish_url?: string | null
          published_at?: string | null
          research_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_bookmarks: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_bookmarks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_stats"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "conversation_bookmarks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "shared_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          action_items: Json | null
          continuation_prompt: string | null
          conversation_id: string
          created_at: string | null
          decisions: Json | null
          entities: Json | null
          id: string
          key_points: Json | null
          last_discussed_at: string | null
          questions: Json | null
          sentiment: string | null
          summary: string | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          continuation_prompt?: string | null
          conversation_id: string
          created_at?: string | null
          decisions?: Json | null
          entities?: Json | null
          id?: string
          key_points?: Json | null
          last_discussed_at?: string | null
          questions?: Json | null
          sentiment?: string | null
          summary?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: Json | null
          continuation_prompt?: string | null
          conversation_id?: string
          created_at?: string | null
          decisions?: Json | null
          entities?: Json | null
          id?: string
          key_points?: Json | null
          last_discussed_at?: string | null
          questions?: Json | null
          sentiment?: string | null
          summary?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          metadata: Json | null
          model_used: string | null
          reactions: Json | null
          reply_to_message_id: string | null
          role: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          metadata?: Json | null
          model_used?: string | null
          reactions?: Json | null
          reply_to_message_id?: string | null
          role: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          metadata?: Json | null
          model_used?: string | null
          reactions?: Json | null
          reply_to_message_id?: string | null
          role?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_stats"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "shared_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversation_messages_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          can_edit_conversation: boolean | null
          can_invite_others: boolean | null
          can_send_messages: boolean | null
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          metadata: Json | null
          notification_enabled: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          can_edit_conversation?: boolean | null
          can_invite_others?: boolean | null
          can_send_messages?: boolean | null
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          metadata?: Json | null
          notification_enabled?: boolean | null
          role?: string
          user_id: string
        }
        Update: {
          can_edit_conversation?: boolean | null
          can_invite_others?: boolean | null
          can_send_messages?: boolean | null
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          metadata?: Json | null
          notification_enabled?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_stats"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "shared_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_document_ids: string[] | null
          context_scope: string | null
          context_space_id: string | null
          created_at: string | null
          id: string
          is_team: boolean | null
          model: string
          organization_id: string
          project_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_document_ids?: string[] | null
          context_scope?: string | null
          context_space_id?: string | null
          created_at?: string | null
          id?: string
          is_team?: boolean | null
          model?: string
          organization_id: string
          project_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_document_ids?: string[] | null
          context_scope?: string | null
          context_space_id?: string | null
          created_at?: string | null
          id?: string
          is_team?: boolean | null
          model?: string
          organization_id?: string
          project_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_context_space_id_fkey"
            columns: ["context_space_id"]
            isOneToOne: false
            referencedRelation: "knowledge_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string | null
          page_url: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_executions: {
        Row: {
          cron_name: string
          duration_ms: number | null
          errors: Json | null
          executed_at: string | null
          id: string
          job_name: string | null
          metadata: Json | null
          nudges_sent: number | null
          result: Json | null
          status: string | null
          users_processed: number | null
        }
        Insert: {
          cron_name: string
          duration_ms?: number | null
          errors?: Json | null
          executed_at?: string | null
          id?: string
          job_name?: string | null
          metadata?: Json | null
          nudges_sent?: number | null
          result?: Json | null
          status?: string | null
          users_processed?: number | null
        }
        Update: {
          cron_name?: string
          duration_ms?: number | null
          errors?: Json | null
          executed_at?: string | null
          id?: string
          job_name?: string | null
          metadata?: Json | null
          nudges_sent?: number | null
          result?: Json | null
          status?: string | null
          users_processed?: number | null
        }
        Relationships: []
      }
      daily_briefings: {
        Row: {
          briefing_date: string
          content: Json
          created_at: string | null
          id: string
          meetings_today: string[] | null
          opened_at: string | null
          promises_due: string[] | null
          sent_at: string | null
          sent_via: string | null
          user_id: string
        }
        Insert: {
          briefing_date: string
          content: Json
          created_at?: string | null
          id?: string
          meetings_today?: string[] | null
          opened_at?: string | null
          promises_due?: string[] | null
          sent_at?: string | null
          sent_via?: string | null
          user_id: string
        }
        Update: {
          briefing_date?: string
          content?: Json
          created_at?: string | null
          id?: string
          meetings_today?: string[] | null
          opened_at?: string | null
          promises_due?: string[] | null
          sent_at?: string | null
          sent_via?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_ecosystem_metrics: {
        Row: {
          active_sessions: number | null
          app_slug: string
          avg_session_duration: number | null
          created_at: string | null
          donations: number | null
          event_counts: Json | null
          expenses: number | null
          id: string
          metric_date: string
          revenue: number | null
          total_events: number | null
          unique_users: number | null
        }
        Insert: {
          active_sessions?: number | null
          app_slug: string
          avg_session_duration?: number | null
          created_at?: string | null
          donations?: number | null
          event_counts?: Json | null
          expenses?: number | null
          id?: string
          metric_date: string
          revenue?: number | null
          total_events?: number | null
          unique_users?: number | null
        }
        Update: {
          active_sessions?: number | null
          app_slug?: string
          avg_session_duration?: number | null
          created_at?: string | null
          donations?: number | null
          event_counts?: Json | null
          expenses?: number | null
          id?: string
          metric_date?: string
          revenue?: number | null
          total_events?: number | null
          unique_users?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_ecosystem_metrics_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "app_connections"
            referencedColumns: ["app_slug"]
          },
          {
            foreignKeyName: "daily_ecosystem_metrics_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "ecosystem_overview"
            referencedColumns: ["app_slug"]
          },
        ]
      }
      decision_comments: {
        Row: {
          author_id: string
          comment_type: string | null
          content: string
          created_at: string | null
          decision_id: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          mentioned_user_ids: string[] | null
          parent_comment_id: string | null
          reactions: Json | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          comment_type?: string | null
          content: string
          created_at?: string | null
          decision_id: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentioned_user_ids?: string[] | null
          parent_comment_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          comment_type?: string | null
          content?: string
          created_at?: string | null
          decision_id?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentioned_user_ids?: string[] | null
          parent_comment_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decision_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_comments_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "decision_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_events: {
        Row: {
          comment: string | null
          created_at: string | null
          decision_id: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          performed_by_system: boolean | null
          to_status: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          decision_id: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_system?: boolean | null
          to_status?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          decision_id?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_system?: boolean | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_events_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decision_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_notifications: {
        Row: {
          created_at: string | null
          decision_id: string
          email_sent_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          sent_email: boolean | null
          sent_in_app: boolean | null
          title: string
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          decision_id: string
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          sent_email?: boolean | null
          sent_in_app?: boolean | null
          title: string
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          decision_id?: string
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          sent_email?: boolean | null
          sent_in_app?: boolean | null
          title?: string
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_notifications_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_notifications_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decision_notifications_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_notifications_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decision_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          ai_analysis: string | null
          ai_analyzed_at: string | null
          ai_confidence: number | null
          ai_recommendation: string | null
          analysis: string | null
          context: string | null
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decision_made: string | null
          decision_rationale: string | null
          defer_reason: string | null
          deferred_until: string | null
          delegated_at: string | null
          delegated_to: string | null
          delegation_due_date: string | null
          delegation_notes: string | null
          description: string | null
          due_date: string | null
          id: string
          implementation_notes: string | null
          implementation_status: string | null
          logged_to_memory: boolean | null
          memory_context_id: string | null
          metadata: Json | null
          next_review_date: string | null
          options: Json | null
          organization_id: string
          priority: string | null
          project_id: string | null
          recommendation: string | null
          review_frequency: string | null
          source_id: string | null
          source_reference: string | null
          source_type: string | null
          spawned_project_id: string | null
          stakeholders: Json | null
          status: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_analyzed_at?: string | null
          ai_confidence?: number | null
          ai_recommendation?: string | null
          analysis?: string | null
          context?: string | null
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_made?: string | null
          decision_rationale?: string | null
          defer_reason?: string | null
          deferred_until?: string | null
          delegated_at?: string | null
          delegated_to?: string | null
          delegation_due_date?: string | null
          delegation_notes?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          implementation_notes?: string | null
          implementation_status?: string | null
          logged_to_memory?: boolean | null
          memory_context_id?: string | null
          metadata?: Json | null
          next_review_date?: string | null
          options?: Json | null
          organization_id: string
          priority?: string | null
          project_id?: string | null
          recommendation?: string | null
          review_frequency?: string | null
          source_id?: string | null
          source_reference?: string | null
          source_type?: string | null
          spawned_project_id?: string | null
          stakeholders?: Json | null
          status?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_analyzed_at?: string | null
          ai_confidence?: number | null
          ai_recommendation?: string | null
          analysis?: string | null
          context?: string | null
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_made?: string | null
          decision_rationale?: string | null
          defer_reason?: string | null
          deferred_until?: string | null
          delegated_at?: string | null
          delegated_to?: string | null
          delegation_due_date?: string | null
          delegation_notes?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          implementation_notes?: string | null
          implementation_status?: string | null
          logged_to_memory?: boolean | null
          memory_context_id?: string | null
          metadata?: Json | null
          next_review_date?: string | null
          options?: Json | null
          organization_id?: string
          priority?: string | null
          project_id?: string | null
          recommendation?: string | null
          review_frequency?: string | null
          source_id?: string | null
          source_reference?: string | null
          source_type?: string | null
          spawned_project_id?: string | null
          stakeholders?: Json | null
          status?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decisions_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_spawned_project_id_fkey"
            columns: ["spawned_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decisions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_relationships: {
        Row: {
          created_at: string | null
          current_focus: string | null
          disciple_contact_id: string | null
          disciple_email: string | null
          disciple_name: string
          disciple_phone: string | null
          goals: string[] | null
          id: string
          meeting_frequency: string | null
          notes: string | null
          relationship_type: string | null
          resources_shared: Json | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_focus?: string | null
          disciple_contact_id?: string | null
          disciple_email?: string | null
          disciple_name: string
          disciple_phone?: string | null
          goals?: string[] | null
          id?: string
          meeting_frequency?: string | null
          notes?: string | null
          relationship_type?: string | null
          resources_shared?: Json | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_focus?: string | null
          disciple_contact_id?: string | null
          disciple_email?: string | null
          disciple_name?: string
          disciple_phone?: string | null
          goals?: string[] | null
          id?: string
          meeting_frequency?: string | null
          notes?: string | null
          relationship_type?: string | null
          resources_shared?: Json | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_relationships_disciple_contact_id_fkey"
            columns: ["disciple_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_sessions: {
        Row: {
          action_items: string[] | null
          created_at: string | null
          duration_minutes: number | null
          follow_up_notes: string | null
          id: string
          key_insights: string | null
          location: string | null
          next_session_date: string | null
          prayer_requests: string | null
          relationship_id: string
          scripture_studied: string | null
          session_date: string
          topics_discussed: string[] | null
          user_id: string
        }
        Insert: {
          action_items?: string[] | null
          created_at?: string | null
          duration_minutes?: number | null
          follow_up_notes?: string | null
          id?: string
          key_insights?: string | null
          location?: string | null
          next_session_date?: string | null
          prayer_requests?: string | null
          relationship_id: string
          scripture_studied?: string | null
          session_date: string
          topics_discussed?: string[] | null
          user_id: string
        }
        Update: {
          action_items?: string[] | null
          created_at?: string | null
          duration_minutes?: number | null
          follow_up_notes?: string | null
          id?: string
          key_insights?: string | null
          location?: string | null
          next_session_date?: string | null
          prayer_requests?: string | null
          relationship_id?: string
          scripture_studied?: string | null
          session_date?: string
          topics_discussed?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_sessions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "discipleship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_tracking: {
        Row: {
          created_at: string | null
          current_stage: string | null
          id: string
          last_contact: string | null
          mentee_name: string | null
          mentor_name: string | null
          name: string | null
          next_followup: string | null
          notes: string | null
          stage: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_stage?: string | null
          id?: string
          last_contact?: string | null
          mentee_name?: string | null
          mentor_name?: string | null
          name?: string | null
          next_followup?: string | null
          notes?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_stage?: string | null
          id?: string
          last_contact?: string | null
          mentee_name?: string | null
          mentor_name?: string | null
          name?: string | null
          next_followup?: string | null
          notes?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_access: {
        Row: {
          access_level: string
          acknowledged_at: string | null
          can_reshare: boolean | null
          document_id: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string
          id: string
          require_acknowledgment: boolean | null
          role_name: string | null
          share_message: string | null
          share_reason: string | null
          shared_in_conversation_id: string | null
          team_id: string | null
          user_id: string | null
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          access_level?: string
          acknowledged_at?: string | null
          can_reshare?: boolean | null
          document_id: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by: string
          id?: string
          require_acknowledgment?: boolean | null
          role_name?: string | null
          share_message?: string | null
          share_reason?: string | null
          shared_in_conversation_id?: string | null
          team_id?: string | null
          user_id?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          access_level?: string
          acknowledged_at?: string | null
          can_reshare?: boolean | null
          document_id?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string
          id?: string
          require_acknowledgment?: boolean | null
          role_name?: string | null
          share_message?: string | null
          share_reason?: string | null
          shared_in_conversation_id?: string | null
          team_id?: string | null
          user_id?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_shared_in_conversation_id_fkey"
            columns: ["shared_in_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_stats"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "document_access_shared_in_conversation_id_fkey"
            columns: ["shared_in_conversation_id"]
            isOneToOne: false
            referencedRelation: "shared_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "knowledge_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_log: {
        Row: {
          access_type: string | null
          accessed_at: string | null
          conversation_id: string | null
          document_id: string | null
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          accessed_at?: string | null
          conversation_id?: string | null
          document_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          accessed_at?: string | null
          conversation_id?: string | null
          document_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          document_id: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          document_id: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          document_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_action_items: {
        Row: {
          assigned_to: string | null
          assigned_to_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          confidence: number | null
          context_snippet: string | null
          created_at: string | null
          description: string | null
          document_id: string
          due_date: string | null
          due_datetime: string | null
          extraction_method: string | null
          id: string
          metadata: Json | null
          organization_id: string
          priority: string | null
          source_section: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          description?: string | null
          document_id: string
          due_date?: string | null
          due_datetime?: string | null
          extraction_method?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          source_section?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          due_date?: string | null
          due_datetime?: string | null
          extraction_method?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          source_section?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_action_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_action_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_action_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_context_usage: {
        Row: {
          document_id: string
          first_used_at: string | null
          id: string
          last_used_at: string | null
          usage_context: string | null
          usage_count: number | null
          used_by_user_id: string
          used_in_entity_id: string
          used_in_entity_type: string
        }
        Insert: {
          document_id: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          usage_context?: string | null
          usage_count?: number | null
          used_by_user_id: string
          used_in_entity_id: string
          used_in_entity_type: string
        }
        Update: {
          document_id?: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          usage_context?: string | null
          usage_count?: number | null
          used_by_user_id?: string
          used_in_entity_id?: string
          used_in_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_context_usage_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_context_usage_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_entities: {
        Row: {
          confidence: number | null
          context_snippet: string | null
          created_at: string | null
          document_id: string
          entity_type: string
          entity_value: string
          id: string
          metadata: Json | null
          normalized_value: string | null
          occurrences: number | null
          organization_id: string
          position_end: number | null
          position_start: number | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          document_id: string
          entity_type: string
          entity_value: string
          id?: string
          metadata?: Json | null
          normalized_value?: string | null
          occurrences?: number | null
          organization_id: string
          position_end?: number | null
          position_start?: number | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          document_id?: string
          entity_type?: string
          entity_value?: string
          id?: string
          metadata?: Json | null
          normalized_value?: string | null
          occurrences?: number | null
          organization_id?: string
          position_end?: number | null
          position_start?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_entities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_entities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          added_at: string | null
          added_by: string | null
          document_id: string
          folder_id: string
          id: string
          position: number | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          document_id: string
          folder_id: string
          id?: string
          position?: number | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          document_id?: string
          folder_id?: string
          id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_folders_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_knowledge_spaces: {
        Row: {
          added_at: string | null
          added_by: string | null
          document_id: string
          id: string
          is_pinned: boolean | null
          knowledge_space_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          document_id: string
          id?: string
          is_pinned?: boolean | null
          knowledge_space_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          document_id?: string
          id?: string
          is_pinned?: boolean | null
          knowledge_space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_knowledge_spaces_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_knowledge_spaces_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_knowledge_spaces_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_knowledge_spaces_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_knowledge_spaces_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_knowledge_spaces_knowledge_space_id_fkey"
            columns: ["knowledge_space_id"]
            isOneToOne: false
            referencedRelation: "knowledge_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_projects: {
        Row: {
          added_at: string | null
          added_by: string | null
          document_id: string
          entity_project_id: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          document_id: string
          entity_project_id?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          document_id?: string
          entity_project_id?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_projects_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_projects_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_entity_project_id_fkey"
            columns: ["entity_project_id"]
            isOneToOne: false
            referencedRelation: "entity_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_relationships: {
        Row: {
          ai_confidence: number | null
          created_at: string | null
          created_by_type: string
          created_by_user_id: string | null
          found_in_conversation_id: string | null
          id: string
          related_document_id: string
          relationship_type: string
          source_document_id: string
          strength: number | null
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string | null
          created_by_type: string
          created_by_user_id?: string | null
          found_in_conversation_id?: string | null
          id?: string
          related_document_id: string
          relationship_type: string
          source_document_id: string
          strength?: number | null
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string | null
          created_by_type?: string
          created_by_user_id?: string | null
          found_in_conversation_id?: string | null
          id?: string
          related_document_id?: string
          relationship_type?: string
          source_document_id?: string
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_relationships_found_in_conversation_id_fkey"
            columns: ["found_in_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_stats"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "document_relationships_found_in_conversation_id_fkey"
            columns: ["found_in_conversation_id"]
            isOneToOne: false
            referencedRelation: "shared_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationships_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationships_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationships_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationships_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          can_edit: boolean | null
          can_reshare: boolean | null
          can_view: boolean | null
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          share_message: string | null
          share_type: string
          shared_by: string
          shared_with_users: string[] | null
        }
        Insert: {
          can_edit?: boolean | null
          can_reshare?: boolean | null
          can_view?: boolean | null
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          share_message?: string | null
          share_type: string
          shared_by: string
          shared_with_users?: string[] | null
        }
        Update: {
          can_edit?: boolean | null
          can_reshare?: boolean | null
          can_view?: boolean | null
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          share_message?: string | null
          share_type?: string
          shared_by?: string
          shared_with_users?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "document_tags_master"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags_master: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_master_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_timeline: {
        Row: {
          confidence: number | null
          context_snippet: string | null
          created_at: string | null
          description: string | null
          document_id: string
          end_datetime: string | null
          event_date: string | null
          event_datetime: string | null
          event_time: string | null
          event_type: string
          id: string
          is_all_day: boolean | null
          metadata: Json | null
          organization_id: string
          priority: string | null
          recurrence_rule: string | null
          status: string | null
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          description?: string | null
          document_id: string
          end_datetime?: string | null
          event_date?: string | null
          event_datetime?: string | null
          event_time?: string | null
          event_type: string
          id?: string
          is_all_day?: boolean | null
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          recurrence_rule?: string | null
          status?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          end_datetime?: string | null
          event_date?: string | null
          event_datetime?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          recurrence_rule?: string | null
          status?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_timeline_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_timeline_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_timeline_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_usage_patterns: {
        Row: {
          document_a_id: string
          document_b_id: string
          id: string
          last_used_together_at: string | null
          times_used_together: number | null
          used_together_in: string
          user_id: string
        }
        Insert: {
          document_a_id: string
          document_b_id: string
          id?: string
          last_used_together_at?: string | null
          times_used_together?: number | null
          used_together_in: string
          user_id: string
        }
        Update: {
          document_a_id?: string
          document_b_id?: string
          id?: string
          last_used_together_at?: string | null
          times_used_together?: number | null
          used_together_in?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_usage_patterns_document_a_id_fkey"
            columns: ["document_a_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_usage_patterns_document_a_id_fkey"
            columns: ["document_a_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_usage_patterns_document_b_id_fkey"
            columns: ["document_b_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_usage_patterns_document_b_id_fkey"
            columns: ["document_b_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_usage_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_usage_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_usage_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_count: number | null
          ai_extracted_topics: string[] | null
          ai_related_document_ids: string[] | null
          ai_relevance_score: number | null
          content: string
          created_at: string | null
          doc_type: string | null
          document_type: string | null
          duration_seconds: number | null
          embedding: string | null
          error_message: string | null
          featured_in_spaces: string[] | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          folder_id: string | null
          id: string
          is_shareable: boolean | null
          key_points: Json | null
          last_accessed_at: string | null
          last_viewed_at: string | null
          media_metadata: Json | null
          media_type: string | null
          mentioned_in_conversations: string[] | null
          metadata: Json | null
          ocr_text: string | null
          organization_id: string
          project_id: string | null
          relevance_score: number | null
          share_message: string | null
          shared_with_team_ids: string[] | null
          shared_with_user_ids: string[] | null
          source: string | null
          status: string
          summary: string | null
          summary_cost_usd: number | null
          summary_generated_at: string | null
          summary_tokens_used: number | null
          team_id: string | null
          thumbnail_url: string | null
          title: string
          transcription: string | null
          transcription_status: string | null
          updated_at: string | null
          used_in_tasks: string[] | null
          user_id: string
          view_count: number | null
          viewed_by_user_ids: string[] | null
          visibility: string | null
        }
        Insert: {
          access_count?: number | null
          ai_extracted_topics?: string[] | null
          ai_related_document_ids?: string[] | null
          ai_relevance_score?: number | null
          content: string
          created_at?: string | null
          doc_type?: string | null
          document_type?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          error_message?: string | null
          featured_in_spaces?: string[] | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          folder_id?: string | null
          id?: string
          is_shareable?: boolean | null
          key_points?: Json | null
          last_accessed_at?: string | null
          last_viewed_at?: string | null
          media_metadata?: Json | null
          media_type?: string | null
          mentioned_in_conversations?: string[] | null
          metadata?: Json | null
          ocr_text?: string | null
          organization_id: string
          project_id?: string | null
          relevance_score?: number | null
          share_message?: string | null
          shared_with_team_ids?: string[] | null
          shared_with_user_ids?: string[] | null
          source?: string | null
          status?: string
          summary?: string | null
          summary_cost_usd?: number | null
          summary_generated_at?: string | null
          summary_tokens_used?: number | null
          team_id?: string | null
          thumbnail_url?: string | null
          title: string
          transcription?: string | null
          transcription_status?: string | null
          updated_at?: string | null
          used_in_tasks?: string[] | null
          user_id: string
          view_count?: number | null
          viewed_by_user_ids?: string[] | null
          visibility?: string | null
        }
        Update: {
          access_count?: number | null
          ai_extracted_topics?: string[] | null
          ai_related_document_ids?: string[] | null
          ai_relevance_score?: number | null
          content?: string
          created_at?: string | null
          doc_type?: string | null
          document_type?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          error_message?: string | null
          featured_in_spaces?: string[] | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          folder_id?: string | null
          id?: string
          is_shareable?: boolean | null
          key_points?: Json | null
          last_accessed_at?: string | null
          last_viewed_at?: string | null
          media_metadata?: Json | null
          media_type?: string | null
          mentioned_in_conversations?: string[] | null
          metadata?: Json | null
          ocr_text?: string | null
          organization_id?: string
          project_id?: string | null
          relevance_score?: number | null
          share_message?: string | null
          shared_with_team_ids?: string[] | null
          shared_with_user_ids?: string[] | null
          source?: string | null
          status?: string
          summary?: string | null
          summary_cost_usd?: number | null
          summary_generated_at?: string | null
          summary_tokens_used?: number | null
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          transcription?: string | null
          transcription_status?: string | null
          updated_at?: string | null
          used_in_tasks?: string[] | null
          user_id?: string
          view_count?: number | null
          viewed_by_user_ids?: string[] | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_transactions: {
        Row: {
          amount: number
          app_slug: string
          category: string | null
          contact_email: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          entity_id: string | null
          external_transaction_id: string | null
          id: string
          metadata: Json | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          app_slug: string
          category?: string | null
          contact_email?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          entity_id?: string | null
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          app_slug?: string
          category?: string | null
          contact_email?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          entity_id?: string | null
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_transactions_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "app_connections"
            referencedColumns: ["app_slug"]
          },
          {
            foreignKeyName: "ecosystem_transactions_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "ecosystem_overview"
            referencedColumns: ["app_slug"]
          },
          {
            foreignKeyName: "ecosystem_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          email_address: string
          id: string
          last_sync_at: string | null
          organization_id: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email_address: string
          id?: string
          last_sync_at?: string | null
          organization_id: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email_address?: string
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          created_at: string | null
          document_id: string | null
          email_id: string
          filename: string
          id: string
          message_id: string
          mime_type: string | null
          organization_id: string
          provider_attachment_id: string
          saved_to_library_at: string | null
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          email_id: string
          filename: string
          id?: string
          message_id: string
          mime_type?: string | null
          organization_id: string
          provider_attachment_id: string
          saved_to_library_at?: string | null
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          email_id?: string
          filename?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          organization_id?: string
          provider_attachment_id?: string
          saved_to_library_at?: string | null
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_folder_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          email_id: string
          folder_id: string
          id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          email_id: string
          folder_id: string
          id?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          email_id?: string
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_folder_assignments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_folders: {
        Row: {
          color: string | null
          created_at: string | null
          email_count: number | null
          folder_type: string | null
          icon: string | null
          id: string
          is_smart: boolean | null
          name: string
          organization_id: string
          slug: string
          smart_rules: Json | null
          sort_order: number | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          email_count?: number | null
          folder_type?: string | null
          icon?: string | null
          id?: string
          is_smart?: boolean | null
          name: string
          organization_id: string
          slug: string
          smart_rules?: Json | null
          sort_order?: number | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          email_count?: number | null
          folder_type?: string | null
          icon?: string | null
          id?: string
          is_smart?: boolean | null
          name?: string
          organization_id?: string
          slug?: string
          smart_rules?: Json | null
          sort_order?: number | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          body: string | null
          body_html: string | null
          body_text: string
          bounce_reason: string | null
          bounced_at: string | null
          clicked_at: string | null
          context_id: string | null
          context_type: string | null
          created_at: string | null
          email_config_id: string | null
          error_message: string | null
          from_email: string | null
          from_name: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          n8n_execution_id: string | null
          n8n_workflow_id: string | null
          opened_at: string | null
          organization_id: string
          recipient_contact_id: string | null
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          related_meeting_id: string | null
          resend_id: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string
          status: string
          subject: string
          to_email: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          body_html?: string | null
          body_text: string
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          email_config_id?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          n8n_execution_id?: string | null
          n8n_workflow_id?: string | null
          opened_at?: string | null
          organization_id: string
          recipient_contact_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          related_meeting_id?: string | null
          resend_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by: string
          status?: string
          subject: string
          to_email?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          body_html?: string | null
          body_text?: string
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          email_config_id?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          n8n_execution_id?: string | null
          n8n_workflow_id?: string | null
          opened_at?: string | null
          organization_id?: string
          recipient_contact_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          related_meeting_id?: string | null
          resend_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string
          status?: string
          subject?: string
          to_email?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_email_config_id_fkey"
            columns: ["email_config_id"]
            isOneToOne: false
            referencedRelation: "email_provider_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_outbox_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_outbox_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_provider_configs: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          daily_send_limit: number | null
          default_from_email: string
          default_from_name: string
          default_reply_to: string | null
          domain_verification_token: string | null
          domain_verified_at: string | null
          email_footer_html: string | null
          email_signature_html: string | null
          id: string
          is_active: boolean | null
          is_domain_verified: boolean | null
          is_primary: boolean | null
          last_send_reset_date: string | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          provider: string
          sending_domain: string | null
          sends_today: number | null
          track_clicks: boolean | null
          track_opens: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          daily_send_limit?: number | null
          default_from_email: string
          default_from_name: string
          default_reply_to?: string | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          email_footer_html?: string | null
          email_signature_html?: string | null
          id?: string
          is_active?: boolean | null
          is_domain_verified?: boolean | null
          is_primary?: boolean | null
          last_send_reset_date?: string | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          provider?: string
          sending_domain?: string | null
          sends_today?: number | null
          track_clicks?: boolean | null
          track_opens?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          daily_send_limit?: number | null
          default_from_email?: string
          default_from_name?: string
          default_reply_to?: string | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          email_footer_html?: string | null
          email_signature_html?: string | null
          id?: string
          is_active?: boolean | null
          is_domain_verified?: boolean | null
          is_primary?: boolean | null
          last_send_reset_date?: string | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          provider?: string
          sending_domain?: string | null
          sends_today?: number | null
          track_clicks?: boolean | null
          track_opens?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_provider_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_sends: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          resend_email_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          sequence_id: string | null
          status: string | null
          step_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          resend_email_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_id?: string | null
          status?: string | null
          step_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          resend_email_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_id?: string | null
          status?: string | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_sends_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_sends_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          email_template: string
          id: string
          is_active: boolean | null
          sequence_id: string | null
          step_number: number
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          email_template: string
          id?: string
          is_active?: boolean | null
          sequence_id?: string | null
          step_number: number
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          email_template?: string
          id?: string
          is_active?: boolean | null
          sequence_id?: string | null
          step_number?: number
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sequence_type: string
          trigger_event: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sequence_type: string
          trigger_event?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sequence_type?: string
          trigger_event?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          ai_category: string | null
          ai_priority_score: number | null
          ai_sentiment: string | null
          ai_summary: string | null
          ai_triaged_at: string | null
          bcc_emails: string[] | null
          body_html: string | null
          body_text: string | null
          category: string | null
          cc_emails: string[] | null
          contact_id: string | null
          created_at: string | null
          email_account_id: string
          from_email: string
          from_name: string | null
          has_attachments: boolean | null
          id: string
          in_reply_to: string | null
          is_archived: boolean | null
          is_important: boolean | null
          is_read: boolean | null
          is_spam: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          organization_id: string
          provider: string
          provider_message_id: string
          provider_thread_id: string | null
          raw_headers: Json | null
          requires_response: boolean | null
          sent_at: string | null
          snippet: string | null
          spam_score: number | null
          subject: string | null
          to_emails: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          ai_triaged_at?: string | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          cc_emails?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          email_account_id: string
          from_email: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          is_archived?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          is_spam?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          organization_id: string
          provider: string
          provider_message_id: string
          provider_thread_id?: string | null
          raw_headers?: Json | null
          requires_response?: boolean | null
          sent_at?: string | null
          snippet?: string | null
          spam_score?: number | null
          subject?: string | null
          to_emails: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          ai_triaged_at?: string | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          cc_emails?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          email_account_id?: string
          from_email?: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          is_archived?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          is_spam?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          organization_id?: string
          provider?: string
          provider_message_id?: string
          provider_thread_id?: string | null
          raw_headers?: Json | null
          requires_response?: boolean | null
          sent_at?: string | null
          snippet?: string | null
          spam_score?: number | null
          subject?: string | null
          to_emails?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_demo_requests: {
        Row: {
          admin_notes: string | null
          company_name: string
          company_size: string | null
          compliance_requirements: Json | null
          contacted_at: string | null
          created_at: string | null
          deal_value: number | null
          demo_completed_at: string | null
          demo_scheduled_at: string | null
          email: string
          estimated_users: number | null
          full_name: string | null
          id: string
          industry: string | null
          job_title: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          referrer: string | null
          required_features: Json | null
          status: string | null
          updated_at: string | null
          use_case: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          company_size?: string | null
          compliance_requirements?: Json | null
          contacted_at?: string | null
          created_at?: string | null
          deal_value?: number | null
          demo_completed_at?: string | null
          demo_scheduled_at?: string | null
          email: string
          estimated_users?: number | null
          full_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          referrer?: string | null
          required_features?: Json | null
          status?: string | null
          updated_at?: string | null
          use_case?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          company_size?: string | null
          compliance_requirements?: Json | null
          contacted_at?: string | null
          created_at?: string | null
          deal_value?: number | null
          demo_completed_at?: string | null
          demo_scheduled_at?: string | null
          email?: string
          estimated_users?: number | null
          full_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          referrer?: string | null
          required_features?: Json | null
          status?: string | null
          updated_at?: string | null
          use_case?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_demo_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          ai_context: Json | null
          color_primary: string | null
          color_secondary: string | null
          created_at: string | null
          description: string | null
          ein: string | null
          email: string | null
          entity_type_id: string | null
          id: string
          is_active: boolean | null
          legal_name: string | null
          logo_url: string | null
          name: string
          organization_id: string | null
          owner_id: string
          phone: string | null
          primary_focus_id: string | null
          settings: Json | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          ai_context?: Json | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          description?: string | null
          ein?: string | null
          email?: string | null
          entity_type_id?: string | null
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          organization_id?: string | null
          owner_id: string
          phone?: string | null
          primary_focus_id?: string | null
          settings?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          ai_context?: Json | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          description?: string | null
          ein?: string | null
          email?: string | null
          entity_type_id?: string | null
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string
          phone?: string | null
          primary_focus_id?: string | null
          settings?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_primary_focus_id_fkey"
            columns: ["primary_focus_id"]
            isOneToOne: false
            referencedRelation: "lookup_focus_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_focus_areas: {
        Row: {
          created_at: string | null
          entity_id: string
          focus_area_id: string
          id: string
          is_primary: boolean | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          focus_area_id: string
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          focus_area_id?: string
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_focus_areas_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_focus_areas_focus_area_id_fkey"
            columns: ["focus_area_id"]
            isOneToOne: false
            referencedRelation: "lookup_focus_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_projects: {
        Row: {
          actual_end_date: string | null
          actual_spend: number | null
          ai_recommendations: Json | null
          ai_summary: string | null
          brand_id: string | null
          budget_amount: number | null
          budget_currency: string | null
          created_at: string | null
          current_stage_id: string | null
          description: string | null
          entity_id: string
          external_id: string | null
          external_url: string | null
          health_status: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          owner_id: string
          priority: string | null
          project_type_id: string | null
          start_date: string | null
          tags: string[] | null
          target_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_spend?: number | null
          ai_recommendations?: Json | null
          ai_summary?: string | null
          brand_id?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          description?: string | null
          entity_id: string
          external_id?: string | null
          external_url?: string | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          owner_id: string
          priority?: string | null
          project_type_id?: string | null
          start_date?: string | null
          tags?: string[] | null
          target_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_spend?: number | null
          ai_recommendations?: Json | null
          ai_summary?: string | null
          brand_id?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          description?: string | null
          entity_id?: string
          external_id?: string | null
          external_url?: string | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          priority?: string | null
          project_type_id?: string | null
          start_date?: string | null
          tags?: string[] | null
          target_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_projects_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_projects_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "lookup_project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_projects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_relationships: {
        Row: {
          confidence: number | null
          context_snippet: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          relationship_strength: number | null
          relationship_type: string
          source_entity_id: string
          target_entity_id: string
        }
        Insert: {
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          relationship_strength?: number | null
          relationship_type: string
          source_entity_id: string
          target_entity_id: string
        }
        Update: {
          confidence?: number | null
          context_snippet?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          relationship_strength?: number | null
          relationship_type?: string
          source_entity_id?: string
          target_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "document_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "document_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      exception_events: {
        Row: {
          comment: string | null
          created_at: string | null
          event_type: string
          exception_id: string
          from_status: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          performed_by_system: boolean | null
          to_status: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          event_type: string
          exception_id: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_system?: boolean | null
          to_status?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          event_type?: string
          exception_id?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_system?: boolean | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exception_events_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exception_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exceptions: {
        Row: {
          acknowledged_at: string | null
          ai_confidence_score: number | null
          ai_suggested_resolution: string | null
          assigned_to: string | null
          can_retry: boolean | null
          created_at: string | null
          description: string | null
          error_code: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          metadata: Json | null
          organization_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number | null
          retry_payload: Json | null
          severity: string
          source_id: string | null
          source_name: string | null
          source_type: string
          stack_trace: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          ai_confidence_score?: number | null
          ai_suggested_resolution?: string | null
          assigned_to?: string | null
          can_retry?: boolean | null
          created_at?: string | null
          description?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          metadata?: Json | null
          organization_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number | null
          retry_payload?: Json | null
          severity?: string
          source_id?: string | null
          source_name?: string | null
          source_type: string
          stack_trace?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          ai_confidence_score?: number | null
          ai_suggested_resolution?: string | null
          assigned_to?: string | null
          can_retry?: boolean | null
          created_at?: string | null
          description?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          metadata?: Json | null
          organization_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number | null
          retry_payload?: Json | null
          severity?: string
          source_id?: string | null
          source_name?: string | null
          source_type?: string
          stack_trace?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exceptions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exceptions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exceptions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_priorities: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          ai_reasoning: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          priority_date: string
          priority_rank: number
          source_id: string | null
          source_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          ai_reasoning?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          priority_date?: string
          priority_rank: number
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          ai_reasoning?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          priority_date?: string
          priority_rank?: number
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_priorities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_priorities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "executive_priorities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_priorities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          expense_date: string | null
          id: string
          is_billable: boolean | null
          receipt_url: string | null
          related_project: string | null
          status: string | null
          user_id: string | null
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          is_billable?: boolean | null
          receipt_url?: string | null
          related_project?: string | null
          status?: string | null
          user_id?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          is_billable?: boolean | null
          receipt_url?: string | null
          related_project?: string | null
          status?: string | null
          user_id?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      external_app_events: {
        Row: {
          actor_contact_id: string | null
          actor_email: string | null
          app_slug: string
          entity_id: string | null
          entity_type: string | null
          event_timestamp: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          processing_result: Json | null
          received_at: string | null
        }
        Insert: {
          actor_contact_id?: string | null
          actor_email?: string | null
          app_slug: string
          entity_id?: string | null
          entity_type?: string | null
          event_timestamp?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          processing_result?: Json | null
          received_at?: string | null
        }
        Update: {
          actor_contact_id?: string | null
          actor_email?: string | null
          app_slug?: string
          entity_id?: string | null
          entity_type?: string | null
          event_timestamp?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          processing_result?: Json | null
          received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_app_events_actor_contact_id_fkey"
            columns: ["actor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_app_events_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "app_connections"
            referencedColumns: ["app_slug"]
          },
          {
            foreignKeyName: "external_app_events_app_slug_fkey"
            columns: ["app_slug"]
            isOneToOne: false
            referencedRelation: "ecosystem_overview"
            referencedColumns: ["app_slug"]
          },
        ]
      }
      external_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          linear_assignee_id: string | null
          linear_assignee_name: string | null
          linear_identifier: string | null
          linear_state_id: string | null
          linear_state_name: string | null
          linear_team_id: string | null
          linear_team_name: string | null
          organization_id: string
          priority: number | null
          provider: string
          provider_project_id: string | null
          provider_project_name: string | null
          provider_task_id: string
          raw_data: Json | null
          status: string | null
          synced_at: string | null
          title: string
          todoist_labels: string[] | null
          todoist_section_id: string | null
          todoist_section_name: string | null
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linear_assignee_id?: string | null
          linear_assignee_name?: string | null
          linear_identifier?: string | null
          linear_state_id?: string | null
          linear_state_name?: string | null
          linear_team_id?: string | null
          linear_team_name?: string | null
          organization_id: string
          priority?: number | null
          provider: string
          provider_project_id?: string | null
          provider_project_name?: string | null
          provider_task_id: string
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          title: string
          todoist_labels?: string[] | null
          todoist_section_id?: string | null
          todoist_section_name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linear_assignee_id?: string | null
          linear_assignee_name?: string | null
          linear_identifier?: string | null
          linear_state_id?: string | null
          linear_state_name?: string | null
          linear_team_id?: string | null
          linear_team_name?: string | null
          organization_id?: string
          priority?: number | null
          provider?: string
          provider_project_id?: string | null
          provider_project_name?: string | null
          provider_task_id?: string
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          title?: string
          todoist_labels?: string[] | null
          todoist_section_id?: string | null
          todoist_section_name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_beta: boolean | null
          is_deprecated: boolean | null
          is_enabled: boolean | null
          name: string
          rollout_percentage: number | null
          slug: string
          tier_access: Json
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_beta?: boolean | null
          is_deprecated?: boolean | null
          is_enabled?: boolean | null
          name: string
          rollout_percentage?: number | null
          slug: string
          tier_access?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_beta?: boolean | null
          is_deprecated?: boolean | null
          is_enabled?: boolean | null
          name?: string
          rollout_percentage?: number | null
          slug?: string
          tier_access?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          parent_folder_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          due_date: string | null
          id: string
          meeting_id: string | null
          priority: string | null
          reason: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          priority?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          priority?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      founder_reviews: {
        Row: {
          action_items: Json | null
          concerns: string[] | null
          content: string | null
          created_at: string | null
          date: string
          highlights: string[] | null
          id: string
          mood: string | null
          org_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          concerns?: string[] | null
          content?: string | null
          created_at?: string | null
          date?: string
          highlights?: string[] | null
          id?: string
          mood?: string | null
          org_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: Json | null
          concerns?: string[] | null
          content?: string | null
          created_at?: string | null
          date?: string
          highlights?: string[] | null
          id?: string
          mood?: string | null
          org_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      global_entities: {
        Row: {
          aliases: string[] | null
          canonical_name: string
          created_at: string | null
          description: string | null
          document_count: number | null
          entity_type: string
          external_links: Json | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          organization_id: string
          source_entity_ids: string[] | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          aliases?: string[] | null
          canonical_name: string
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          entity_type: string
          external_links?: Json | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          organization_id: string
          source_entity_ids?: string[] | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          aliases?: string[] | null
          canonical_name?: string
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          entity_type?: string
          external_links?: Json | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          organization_id?: string
          source_entity_ids?: string[] | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          application_url: string | null
          created_at: string | null
          deadline: string | null
          eligibility: string | null
          focus_areas: Json | null
          id: string
          name: string | null
          organization: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          application_url?: string | null
          created_at?: string | null
          deadline?: string | null
          eligibility?: string | null
          focus_areas?: Json | null
          id?: string
          name?: string | null
          organization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          application_url?: string | null
          created_at?: string | null
          deadline?: string | null
          eligibility?: string | null
          focus_areas?: Json | null
          id?: string
          name?: string | null
          organization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      heartbeat_runs: {
        Row: {
          check_results: Json | null
          checks_run: Json | null
          completed_at: string | null
          error_message: string | null
          id: string
          insights: Json | null
          metadata: Json | null
          notification_channel: string | null
          notification_sent: boolean | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          check_results?: Json | null
          checks_run?: Json | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          insights?: Json | null
          metadata?: Json | null
          notification_channel?: string | null
          notification_sent?: boolean | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          check_results?: Json | null
          checks_run?: Json | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          insights?: Json | null
          metadata?: Json | null
          notification_channel?: string | null
          notification_sent?: boolean | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      idea_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          idea_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          idea_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          idea_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_notes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          ai_insights: Json | null
          category: string | null
          created_at: string | null
          description: string | null
          enhanced_version: string | null
          feasibility_score: number | null
          id: string
          impact_score: number | null
          priority: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_insights?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          enhanced_version?: string | null
          feasibility_score?: number | null
          id?: string
          impact_score?: number | null
          priority?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_insights?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          enhanced_version?: string | null
          feasibility_score?: number | null
          id?: string
          impact_score?: number | null
          priority?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      image_analysis: {
        Row: {
          ai_description: string | null
          content_type: string | null
          created_at: string | null
          detected_faces_count: number | null
          detected_objects: Json | null
          detected_text_blocks: Json | null
          document_id: string
          dominant_colors: Json | null
          format: string | null
          id: string
          image_height: number | null
          image_width: number | null
          model_used: string | null
          ocr_confidence: number | null
          ocr_text: string | null
          organization_id: string
          processing_time_ms: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          ai_description?: string | null
          content_type?: string | null
          created_at?: string | null
          detected_faces_count?: number | null
          detected_objects?: Json | null
          detected_text_blocks?: Json | null
          document_id: string
          dominant_colors?: Json | null
          format?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          model_used?: string | null
          ocr_confidence?: number | null
          ocr_text?: string | null
          organization_id: string
          processing_time_ms?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ai_description?: string | null
          content_type?: string | null
          created_at?: string | null
          detected_faces_count?: number | null
          detected_objects?: Json | null
          detected_text_blocks?: Json | null
          document_id?: string
          dominant_colors?: Json | null
          format?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          model_used?: string | null
          ocr_confidence?: number | null
          ocr_text?: string | null
          organization_id?: string
          processing_time_ms?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_analysis_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_analysis_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          message: string | null
          role: string
          status: string
          token: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          message?: string | null
          role?: string
          status?: string
          token?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          message?: string | null
          role?: string
          status?: string
          token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          notes: string | null
          paid_date: string | null
          related_project_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          related_project_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          related_project_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      item_relationships: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          relationship_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          relationship_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          relationship_type?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "item_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_stakeholders: {
        Row: {
          added_by: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          notes: string | null
          notify_on_comments: boolean | null
          notify_on_decision: boolean | null
          notify_on_updates: boolean | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          added_by?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          notify_on_comments?: boolean | null
          notify_on_decision?: boolean | null
          notify_on_updates?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          added_by?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          notify_on_comments?: boolean | null
          notify_on_decision?: boolean | null
          notify_on_updates?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_stakeholders_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "item_stakeholders_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_stakeholders_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_stakeholders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "item_stakeholders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_stakeholders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_contributions: {
        Row: {
          contribution_type: string
          created_at: string
          helpful_votes: number | null
          id: string
          metadata: Json | null
          organization_id: string
          resource_id: string
          resource_title: string | null
          shares_count: number | null
          tags: string[] | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          contribution_type: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          metadata?: Json | null
          organization_id: string
          resource_id: string
          resource_title?: string | null
          shares_count?: number | null
          tags?: string[] | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          contribution_type?: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          resource_id?: string
          resource_title?: string | null
          shares_count?: number | null
          tags?: string[] | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_contributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph: {
        Row: {
          confidence: number | null
          context_tags: string[] | null
          created_at: string | null
          domain: string | null
          evidence_count: number | null
          evidence_sources: Json | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          organization_id: string
          relationship_type: string
          source_concept: string
          strength: number | null
          target_concept: string
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          domain?: string | null
          evidence_count?: number | null
          evidence_sources?: Json | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          organization_id: string
          relationship_type: string
          source_concept: string
          strength?: number | null
          target_concept: string
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          domain?: string | null
          evidence_count?: number | null
          evidence_sources?: Json | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          organization_id?: string
          relationship_type?: string
          source_concept?: string
          strength?: number | null
          target_concept?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graph_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_spaces: {
        Row: {
          auto_share_rules: Json | null
          auto_tag_rules: Json | null
          color: string | null
          conversation_count: number | null
          created_at: string | null
          default_folder_id: string | null
          description: string | null
          document_count: number | null
          emoji: string | null
          featured_document_ids: string[] | null
          id: string
          is_archived: boolean | null
          is_private: boolean | null
          member_count: number | null
          member_ids: string[] | null
          moderator_ids: string[] | null
          name: string
          organization_id: string
          owner_id: string
          pinned_conversation_ids: string[] | null
          rag_enabled: boolean | null
          rag_scope: string | null
          space_type: string
          updated_at: string | null
        }
        Insert: {
          auto_share_rules?: Json | null
          auto_tag_rules?: Json | null
          color?: string | null
          conversation_count?: number | null
          created_at?: string | null
          default_folder_id?: string | null
          description?: string | null
          document_count?: number | null
          emoji?: string | null
          featured_document_ids?: string[] | null
          id?: string
          is_archived?: boolean | null
          is_private?: boolean | null
          member_count?: number | null
          member_ids?: string[] | null
          moderator_ids?: string[] | null
          name: string
          organization_id: string
          owner_id: string
          pinned_conversation_ids?: string[] | null
          rag_enabled?: boolean | null
          rag_scope?: string | null
          space_type?: string
          updated_at?: string | null
        }
        Update: {
          auto_share_rules?: Json | null
          auto_tag_rules?: Json | null
          color?: string | null
          conversation_count?: number | null
          created_at?: string | null
          default_folder_id?: string | null
          description?: string | null
          document_count?: number | null
          emoji?: string | null
          featured_document_ids?: string[] | null
          id?: string
          is_archived?: boolean | null
          is_private?: boolean | null
          member_count?: number | null
          member_ids?: string[] | null
          moderator_ids?: string[] | null
          name?: string
          organization_id?: string
          owner_id?: string
          pinned_conversation_ids?: string[] | null
          rag_enabled?: boolean | null
          rag_scope?: string | null
          space_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_spaces_default_folder_id_fkey"
            columns: ["default_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_spaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_email_sequence_state: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          enrolled_at: string | null
          id: string
          last_sent_at: string | null
          lead_id: string
          lead_type: string
          next_send_date: string | null
          sequence_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          last_sent_at?: string | null
          lead_id: string
          lead_type: string
          next_send_date?: string | null
          sequence_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          last_sent_at?: string | null
          lead_id?: string
          lead_type?: string
          next_send_date?: string | null
          sequence_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_email_sequence_state_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          company_name: string | null
          company_size: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          industry: string | null
          last_name: string | null
          lead_magnet: string | null
          metadata: Json | null
          phone: string | null
          qualification_notes: string | null
          qualification_score: number | null
          segment: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          company?: string | null
          company_name?: string | null
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          lead_magnet?: string | null
          metadata?: Json | null
          phone?: string | null
          qualification_notes?: string | null
          qualification_score?: number | null
          segment?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          company?: string | null
          company_name?: string | null
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          lead_magnet?: string | null
          metadata?: Json | null
          phone?: string | null
          qualification_notes?: string | null
          qualification_score?: number | null
          segment?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      learning_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_source: string
          event_type: string
          id: string
          insights_generated: string[] | null
          organization_id: string
          patterns_updated: string[] | null
          preferences_updated: string[] | null
          processed: boolean | null
          processed_at: string | null
          source_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_source: string
          event_type: string
          id?: string
          insights_generated?: string[] | null
          organization_id: string
          patterns_updated?: string[] | null
          preferences_updated?: string[] | null
          processed?: boolean | null
          processed_at?: string | null
          source_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_source?: string
          event_type?: string
          id?: string
          insights_generated?: string[] | null
          organization_id?: string
          patterns_updated?: string[] | null
          preferences_updated?: string[] | null
          processed?: boolean | null
          processed_at?: string | null
          source_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_content_types: {
        Row: {
          created_at: string | null
          default_platforms: string[] | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          default_platforms?: string[] | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          default_platforms?: string[] | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lookup_entity_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lookup_focus_areas: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lookup_platforms: {
        Row: {
          api_config: Json | null
          character_limit: number | null
          created_at: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          supports_images: boolean | null
          supports_links: boolean | null
          supports_video: boolean | null
        }
        Insert: {
          api_config?: Json | null
          character_limit?: number | null
          created_at?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          supports_images?: boolean | null
          supports_links?: boolean | null
          supports_video?: boolean | null
        }
        Update: {
          api_config?: Json | null
          character_limit?: number | null
          created_at?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          supports_images?: boolean | null
          supports_links?: boolean | null
          supports_video?: boolean | null
        }
        Relationships: []
      }
      lookup_project_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_terminal: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_terminal?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_terminal?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lookup_project_types: {
        Row: {
          created_at: string | null
          default_stages: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          default_stages?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          default_stages?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      media_transcriptions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          document_id: string
          duration_seconds: number | null
          full_text: string
          id: string
          language: string | null
          model_used: string | null
          organization_id: string
          processing_time_ms: number | null
          segments: Json | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          document_id: string
          duration_seconds?: number | null
          full_text: string
          id?: string
          language?: string | null
          model_used?: string | null
          organization_id: string
          processing_time_ms?: number | null
          segments?: Json | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string
          duration_seconds?: number | null
          full_text?: string
          id?: string
          language?: string | null
          model_used?: string | null
          organization_id?: string
          processing_time_ms?: number | null
          segments?: Json | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_transcriptions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_transcriptions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_transcriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_action_items: {
        Row: {
          assigned_contact_id: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_task_id: string | null
          meeting_id: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_contact_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_task_id?: string | null
          meeting_id?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_contact_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_task_id?: string | null
          meeting_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          meeting_id: string | null
          role_in_meeting: string | null
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          role_in_meeting?: string | null
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          role_in_meeting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_briefings: {
        Row: {
          attendees: string[] | null
          briefing_content: Json | null
          calendar_event_id: string | null
          created_at: string | null
          id: string
          meeting_time: string | null
          meeting_title: string | null
          past_meetings_referenced: string[] | null
          sent_at: string | null
          sent_via: string | null
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          briefing_content?: Json | null
          calendar_event_id?: string | null
          created_at?: string | null
          id?: string
          meeting_time?: string | null
          meeting_title?: string | null
          past_meetings_referenced?: string[] | null
          sent_at?: string | null
          sent_via?: string | null
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          briefing_content?: Json | null
          calendar_event_id?: string | null
          created_at?: string | null
          id?: string
          meeting_time?: string | null
          meeting_title?: string | null
          past_meetings_referenced?: string[] | null
          sent_at?: string | null
          sent_via?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_follow_ups: {
        Row: {
          created_at: string | null
          follow_up_meeting_id: string | null
          id: string
          notes: string | null
          original_meeting_id: string | null
          relationship_type: string | null
        }
        Insert: {
          created_at?: string | null
          follow_up_meeting_id?: string | null
          id?: string
          notes?: string | null
          original_meeting_id?: string | null
          relationship_type?: string | null
        }
        Update: {
          created_at?: string | null
          follow_up_meeting_id?: string | null
          id?: string
          notes?: string | null
          original_meeting_id?: string | null
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_follow_ups_follow_up_meeting_id_fkey"
            columns: ["follow_up_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_follow_ups_original_meeting_id_fkey"
            columns: ["original_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_sentiment_history: {
        Row: {
          analyzed_at: string | null
          contact_id: string | null
          contact_name: string | null
          id: string
          key_indicators: string[] | null
          meeting_id: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          contact_id?: string | null
          contact_name?: string | null
          id?: string
          key_indicators?: string[] | null
          meeting_id?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          contact_id?: string | null
          contact_name?: string | null
          id?: string
          key_indicators?: string[] | null
          meeting_id?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_sentiment_history_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_series: {
        Row: {
          created_at: string | null
          default_attendees: string[] | null
          description: string | null
          id: string
          is_active: boolean | null
          meeting_type: string | null
          name: string
          project_tags: string[] | null
          recurrence: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_attendees?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name: string
          project_tags?: string[] | null
          recurrence?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_attendees?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name?: string
          project_tags?: string[] | null
          recurrence?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_templates: {
        Row: {
          created_at: string | null
          default_agenda: Json | null
          default_questions: string[] | null
          description: string | null
          follow_up_template: string | null
          id: string
          is_active: boolean | null
          meeting_type: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_agenda?: Json | null
          default_questions?: string[] | null
          description?: string | null
          follow_up_template?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_agenda?: Json | null
          default_questions?: string[] | null
          description?: string | null
          follow_up_template?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          action_items: Json | null
          attendees: string[] | null
          created_at: string | null
          decisions_made: string[] | null
          executive_summary: string | null
          follow_up_needed: boolean | null
          follow_up_sent: boolean | null
          id: string
          key_topics: string[] | null
          meeting_date: string | null
          meeting_title: string | null
          meeting_type: string | null
          next_steps: string[] | null
          opportunities_detected: Json | null
          project_tags: string[] | null
          sentiment: string | null
          source: string | null
          status: string | null
          suggested_follow_up_date: string | null
          summary: Json | null
          title: string | null
          transcript: string | null
          updated_at: string | null
          user_id: string
          webhook_payload: Json | null
        }
        Insert: {
          action_items?: Json | null
          attendees?: string[] | null
          created_at?: string | null
          decisions_made?: string[] | null
          executive_summary?: string | null
          follow_up_needed?: boolean | null
          follow_up_sent?: boolean | null
          id?: string
          key_topics?: string[] | null
          meeting_date?: string | null
          meeting_title?: string | null
          meeting_type?: string | null
          next_steps?: string[] | null
          opportunities_detected?: Json | null
          project_tags?: string[] | null
          sentiment?: string | null
          source?: string | null
          status?: string | null
          suggested_follow_up_date?: string | null
          summary?: Json | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id: string
          webhook_payload?: Json | null
        }
        Update: {
          action_items?: Json | null
          attendees?: string[] | null
          created_at?: string | null
          decisions_made?: string[] | null
          executive_summary?: string | null
          follow_up_needed?: boolean | null
          follow_up_sent?: boolean | null
          id?: string
          key_topics?: string[] | null
          meeting_date?: string | null
          meeting_title?: string | null
          meeting_type?: string | null
          next_steps?: string[] | null
          opportunities_detected?: Json | null
          project_tags?: string[] | null
          sentiment?: string | null
          source?: string | null
          status?: string | null
          suggested_follow_up_date?: string | null
          summary?: Json | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_payload?: Json | null
        }
        Relationships: []
      }
      mentions: {
        Row: {
          content_snippet: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_read: boolean | null
          mentioned_by_user_id: string
          mentioned_user_id: string
          organization_id: string
          read_at: string | null
        }
        Insert: {
          content_snippet?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_read?: boolean | null
          mentioned_by_user_id: string
          mentioned_user_id: string
          organization_id: string
          read_at?: string | null
        }
        Update: {
          content_snippet?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_read?: boolean | null
          mentioned_by_user_id?: string
          mentioned_user_id?: string
          organization_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          id: string
          model_used: string | null
          role: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          role: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          role?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_events: {
        Row: {
          actual_attendance: number | null
          all_day: boolean | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string | null
          event_name: string | null
          event_type: string
          expected_attendance: number | null
          id: string
          location: string | null
          location_address: string | null
          location_name: string | null
          location_type: string | null
          name: string | null
          notes: string | null
          organization_id: string | null
          organizer: string | null
          recurring_end_date: string | null
          recurring_pattern: string | null
          resources: Json | null
          start_time: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          virtual_link: string | null
        }
        Insert: {
          actual_attendance?: number | null
          all_day?: boolean | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type: string
          expected_attendance?: number | null
          id?: string
          location?: string | null
          location_address?: string | null
          location_name?: string | null
          location_type?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          organizer?: string | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          resources?: Json | null
          start_time: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          virtual_link?: string | null
        }
        Update: {
          actual_attendance?: number | null
          all_day?: boolean | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: string
          expected_attendance?: number | null
          id?: string
          location?: string | null
          location_address?: string | null
          location_name?: string | null
          location_type?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          organizer?: string | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          resources?: Json | null
          start_time?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministry_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_event_mappings: {
        Row: {
          created_at: string | null
          event_type: string
          filter_conditions: Json | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          n8n_workflow_id: string
          organization_id: string
          payload_transform: Json | null
          trigger_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          filter_conditions?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          n8n_workflow_id: string
          organization_id: string
          payload_transform?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          filter_conditions?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          n8n_workflow_id?: string
          organization_id?: string
          payload_transform?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_event_mappings_n8n_workflow_id_fkey"
            columns: ["n8n_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_event_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_integrations: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_sync_at: string | null
          last_verified_at: string | null
          n8n_instance_url: string
          name: string
          organization_id: string
          total_executions: number | null
          updated_at: string | null
          workflow_count: number | null
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          last_verified_at?: string | null
          n8n_instance_url: string
          name?: string
          organization_id: string
          total_executions?: number | null
          updated_at?: string | null
          workflow_count?: number | null
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          last_verified_at?: string | null
          n8n_instance_url?: string
          name?: string
          organization_id?: string
          total_executions?: number | null
          updated_at?: string | null
          workflow_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_template_installations: {
        Row: {
          custom_config: Json | null
          id: string
          installed_at: string | null
          installed_by: string | null
          n8n_integration_id: string | null
          n8n_workflow_id: string | null
          organization_id: string
          status: string | null
          template_id: string
        }
        Insert: {
          custom_config?: Json | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          n8n_integration_id?: string | null
          n8n_workflow_id?: string | null
          organization_id: string
          status?: string | null
          template_id: string
        }
        Update: {
          custom_config?: Json | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          n8n_integration_id?: string | null
          n8n_workflow_id?: string | null
          organization_id?: string
          status?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_template_installations_n8n_integration_id_fkey"
            columns: ["n8n_integration_id"]
            isOneToOne: false
            referencedRelation: "n8n_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_template_installations_n8n_workflow_id_fkey"
            columns: ["n8n_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_template_installations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_template_installations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "n8n_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_templates: {
        Row: {
          author_name: string | null
          author_org_id: string | null
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          input_schema: Json | null
          install_count: number | null
          is_active: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          output_schema: Json | null
          rating: number | null
          rating_count: number | null
          required_credentials: string[] | null
          tags: string[] | null
          updated_at: string | null
          version: string | null
          workflow_json: Json
        }
        Insert: {
          author_name?: string | null
          author_org_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          input_schema?: Json | null
          install_count?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          output_schema?: Json | null
          rating?: number | null
          rating_count?: number | null
          required_credentials?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
          workflow_json: Json
        }
        Update: {
          author_name?: string | null
          author_org_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          input_schema?: Json | null
          install_count?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          output_schema?: Json | null
          rating?: number | null
          rating_count?: number | null
          required_credentials?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
          workflow_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "n8n_templates_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          n8n_execution_id: string | null
          n8n_workflow_id: string
          organization_id: string
          output_data: Json | null
          started_at: string | null
          status: string
          trigger_data: Json | null
          triggered_by: string
          triggered_by_user: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          n8n_execution_id?: string | null
          n8n_workflow_id: string
          organization_id: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          trigger_data?: Json | null
          triggered_by?: string
          triggered_by_user?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          n8n_execution_id?: string | null
          n8n_workflow_id?: string
          organization_id?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          trigger_data?: Json | null
          triggered_by?: string
          triggered_by_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_workflow_executions_n8n_workflow_id_fkey"
            columns: ["n8n_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_workflow_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_workflows: {
        Row: {
          avg_execution_time_ms: number | null
          category: string | null
          created_at: string | null
          description: string | null
          failed_executions: number | null
          id: string
          is_active: boolean | null
          is_synced: boolean | null
          last_execution_at: string | null
          last_execution_status: string | null
          last_synced_at: string | null
          local_name: string | null
          n8n_integration_id: string
          n8n_workflow_id: string
          n8n_workflow_name: string
          organization_id: string
          successful_executions: number | null
          tags: string[] | null
          total_executions: number | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          avg_execution_time_ms?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          failed_executions?: number | null
          id?: string
          is_active?: boolean | null
          is_synced?: boolean | null
          last_execution_at?: string | null
          last_execution_status?: string | null
          last_synced_at?: string | null
          local_name?: string | null
          n8n_integration_id: string
          n8n_workflow_id: string
          n8n_workflow_name: string
          organization_id: string
          successful_executions?: number | null
          tags?: string[] | null
          total_executions?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          avg_execution_time_ms?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          failed_executions?: number | null
          id?: string
          is_active?: boolean | null
          is_synced?: boolean | null
          last_execution_at?: string | null
          last_execution_status?: string | null
          last_synced_at?: string | null
          local_name?: string | null
          n8n_integration_id?: string
          n8n_workflow_id?: string
          n8n_workflow_name?: string
          organization_id?: string
          successful_executions?: number | null
          tags?: string[] | null
          total_executions?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_workflows_n8n_integration_id_fkey"
            columns: ["n8n_integration_id"]
            isOneToOne: false
            referencedRelation: "n8n_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_required: boolean | null
          created_at: string
          id: string
          is_read: boolean | null
          link_url: string | null
          message: string
          metadata: Json | null
          organization_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_required?: boolean | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message: string
          metadata?: Json | null
          organization_id: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_required?: boolean | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          metadata?: Json | null
          organization_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          service: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          service?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          service?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          step_key: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_key: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_key?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_context: {
        Row: {
          content: string
          context_type: string
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          importance: string | null
          is_active: boolean | null
          key_points: string[] | null
          organization_id: string
          related_context_ids: string[] | null
          source: string | null
          source_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: string
          context_type: string
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          importance?: string | null
          is_active?: boolean | null
          key_points?: string[] | null
          organization_id: string
          related_context_ids?: string[] | null
          source?: string | null
          source_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string
          context_type?: string
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          importance?: string | null
          is_active?: boolean | null
          key_points?: string[] | null
          organization_id?: string
          related_context_ids?: string[] | null
          source?: string | null
          source_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_context_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_feature_overrides: {
        Row: {
          created_at: string | null
          expires_at: string | null
          feature_id: string
          granted_by: string | null
          id: string
          is_enabled: boolean | null
          limit_override: number | null
          organization_id: string
          reason: string | null
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          feature_id: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean | null
          limit_override?: number | null
          organization_id: string
          reason?: string | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          feature_id?: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean | null
          limit_override?: number | null
          organization_id?: string
          reason?: string | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_feature_overrides_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_feature_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outreach_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          settings: Json | null
          stats: Json | null
          status: string | null
          steps: Json | null
          trigger_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          stats?: Json | null
          status?: string | null
          steps?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          stats?: Json | null
          status?: string | null
          steps?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      overage_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_sent_at: string | null
          created_at: string | null
          current_percentage: number | null
          id: string
          is_active: boolean | null
          meter_type: string
          notify_email: boolean | null
          notify_in_app: boolean | null
          notify_webhook: boolean | null
          organization_id: string
          threshold_percentage: number
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_sent_at?: string | null
          created_at?: string | null
          current_percentage?: number | null
          id?: string
          is_active?: boolean | null
          meter_type: string
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          notify_webhook?: boolean | null
          organization_id: string
          threshold_percentage: number
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_sent_at?: string | null
          created_at?: string | null
          current_percentage?: number | null
          id?: string
          is_active?: boolean | null
          meter_type?: string
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          notify_webhook?: boolean | null
          organization_id?: string
          threshold_percentage?: number
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overage_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource_type?: string
        }
        Relationships: []
      }
      pinned_messages: {
        Row: {
          channel_id: string
          id: string
          message_id: string
          note: string | null
          pinned_at: string | null
          pinned_by: string | null
        }
        Insert: {
          channel_id: string
          id?: string
          message_id: string
          note?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
        }
        Update: {
          channel_id?: string
          id?: string
          message_id?: string
          note?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_overage_config: {
        Row: {
          created_at: string | null
          id: string
          included_agent_runs: number | null
          included_ai_tokens: number | null
          included_api_calls: number | null
          included_premium_model_tokens: number | null
          included_storage_gb: number | null
          max_overage_usd: number | null
          overage_allowed: boolean | null
          overage_rate_per_1k_tokens: number | null
          overage_rate_per_api_call: number | null
          overage_rate_per_gb: number | null
          plan: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          included_agent_runs?: number | null
          included_ai_tokens?: number | null
          included_api_calls?: number | null
          included_premium_model_tokens?: number | null
          included_storage_gb?: number | null
          max_overage_usd?: number | null
          overage_allowed?: boolean | null
          overage_rate_per_1k_tokens?: number | null
          overage_rate_per_api_call?: number | null
          overage_rate_per_gb?: number | null
          plan: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          included_agent_runs?: number | null
          included_ai_tokens?: number | null
          included_api_calls?: number | null
          included_premium_model_tokens?: number | null
          included_storage_gb?: number | null
          max_overage_usd?: number | null
          overage_allowed?: boolean | null
          overage_rate_per_1k_tokens?: number | null
          overage_rate_per_api_call?: number | null
          overage_rate_per_gb?: number | null
          plan?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          answer_notes: string | null
          answered_at: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_confidential: boolean | null
          priority: string | null
          request_text: string | null
          request_type: string | null
          requester_contact_id: string | null
          requester_email: string | null
          requester_name: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_notes?: string | null
          answered_at?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_confidential?: boolean | null
          priority?: string | null
          request_text?: string | null
          request_type?: string | null
          requester_contact_id?: string | null
          requester_email?: string | null
          requester_name?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_notes?: string | null
          answered_at?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_confidential?: boolean | null
          priority?: string | null
          request_text?: string | null
          request_type?: string | null
          requester_contact_id?: string | null
          requester_email?: string | null
          requester_name?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_requester_contact_id_fkey"
            columns: ["requester_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      predictive_suggestions: {
        Row: {
          accepted_at: string | null
          applicable_scenarios: Json | null
          based_on_insights: string[] | null
          based_on_patterns: string[] | null
          based_on_preferences: string[] | null
          confidence: number | null
          context_tags: string[] | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          id: string
          organization_id: string
          priority: string | null
          relevance_score: number | null
          shown_at: string | null
          status: string | null
          suggested_action: Json | null
          suggestion_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          applicable_scenarios?: Json | null
          based_on_insights?: string[] | null
          based_on_patterns?: string[] | null
          based_on_preferences?: string[] | null
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          relevance_score?: number | null
          shown_at?: string | null
          status?: string | null
          suggested_action?: Json | null
          suggestion_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          applicable_scenarios?: Json | null
          based_on_insights?: string[] | null
          based_on_patterns?: string[] | null
          based_on_preferences?: string[] | null
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          relevance_score?: number | null
          shown_at?: string | null
          status?: string | null
          suggested_action?: Json | null
          suggestion_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictive_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_nudges: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          action_taken: string | null
          channel: string
          created_at: string | null
          id: string
          nudge_content: string
          nudge_data: Json | null
          organization_id: string | null
          response_text: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_taken?: string | null
          channel: string
          created_at?: string | null
          id?: string
          nudge_content: string
          nudge_data?: Json | null
          organization_id?: string | null
          response_text?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_taken?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          nudge_content?: string
          nudge_data?: Json | null
          organization_id?: string | null
          response_text?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proactive_nudges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_team_context: string | null
          ai_experience_level: string | null
          avatar_url: string | null
          beta_tester: boolean | null
          beta_tier: string | null
          bio: string | null
          content_types: string[] | null
          created_at: string | null
          department: string | null
          email: string
          email_filter_preferences: Json | null
          expertise: string[] | null
          full_name: string | null
          id: string
          industry: string | null
          is_admin: boolean | null
          is_online: boolean | null
          is_super_admin: boolean | null
          job_title: string | null
          last_sign_in_at: string | null
          notification_preferences: Json | null
          onboarding_checklist_dismissed: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          onboarding_step: number | null
          organization_id: string | null
          preferences: Json | null
          preferred_name: string | null
          primary_goal: string | null
          primary_goals: string[] | null
          role: string | null
          slack_channel_id: string | null
          team_context: string | null
          team_context_switched_at: string | null
          telegram_chat_id: string | null
          telegram_username: string | null
          timezone: string | null
          updated_at: string | null
          use_case_tags: string[] | null
          user_role: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active_team_context?: string | null
          ai_experience_level?: string | null
          avatar_url?: string | null
          beta_tester?: boolean | null
          beta_tier?: string | null
          bio?: string | null
          content_types?: string[] | null
          created_at?: string | null
          department?: string | null
          email: string
          email_filter_preferences?: Json | null
          expertise?: string[] | null
          full_name?: string | null
          id: string
          industry?: string | null
          is_admin?: boolean | null
          is_online?: boolean | null
          is_super_admin?: boolean | null
          job_title?: string | null
          last_sign_in_at?: string | null
          notification_preferences?: Json | null
          onboarding_checklist_dismissed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_step?: number | null
          organization_id?: string | null
          preferences?: Json | null
          preferred_name?: string | null
          primary_goal?: string | null
          primary_goals?: string[] | null
          role?: string | null
          slack_channel_id?: string | null
          team_context?: string | null
          team_context_switched_at?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          timezone?: string | null
          updated_at?: string | null
          use_case_tags?: string[] | null
          user_role?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active_team_context?: string | null
          ai_experience_level?: string | null
          avatar_url?: string | null
          beta_tester?: boolean | null
          beta_tier?: string | null
          bio?: string | null
          content_types?: string[] | null
          created_at?: string | null
          department?: string | null
          email?: string
          email_filter_preferences?: Json | null
          expertise?: string[] | null
          full_name?: string | null
          id?: string
          industry?: string | null
          is_admin?: boolean | null
          is_online?: boolean | null
          is_super_admin?: boolean | null
          job_title?: string | null
          last_sign_in_at?: string | null
          notification_preferences?: Json | null
          onboarding_checklist_dismissed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_step?: number | null
          organization_id?: string | null
          preferences?: Json | null
          preferred_name?: string | null
          primary_goal?: string | null
          primary_goals?: string[] | null
          role?: string | null
          slack_channel_id?: string | null
          team_context?: string | null
          team_context_switched_at?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          timezone?: string | null
          updated_at?: string | null
          use_case_tags?: string[] | null
          user_role?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_team_context_fkey"
            columns: ["active_team_context"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          can_edit_project: boolean | null
          can_invite_members: boolean | null
          can_manage_milestones: boolean | null
          can_manage_tasks: boolean | null
          can_upload_files: boolean | null
          id: string
          invited_by: string | null
          joined_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          can_edit_project?: boolean | null
          can_invite_members?: boolean | null
          can_manage_milestones?: boolean | null
          can_manage_tasks?: boolean | null
          can_upload_files?: boolean | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          can_edit_project?: boolean | null
          can_invite_members?: boolean | null
          can_manage_milestones?: boolean | null
          can_manage_tasks?: boolean | null
          can_upload_files?: boolean | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_key_milestone: boolean | null
          name: string
          project_id: string
          sort_order: number | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_key_milestone?: boolean | null
          name: string
          project_id: string
          sort_order?: number | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_key_milestone?: boolean | null
          name?: string
          project_id?: string
          sort_order?: number | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stage_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_stage_id: string | null
          id: string
          project_id: string
          reason: string | null
          to_stage_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_stage_id?: string | null
          id?: string
          project_id: string
          reason?: string | null
          to_stage_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_stage_id?: string | null
          id?: string
          project_id?: string
          reason?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "lookup_project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "entity_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "lookup_project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          is_complete: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_complete?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_complete?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ai_contacts_matched_at: string | null
          ai_context: Json | null
          budget: number | null
          client_name: string | null
          color: string | null
          completed_at: string | null
          completed_date: string | null
          conversation_count: number | null
          created_at: string | null
          created_by: string | null
          current_stage: string | null
          description: string | null
          emoji: string | null
          goals: string[] | null
          icon: string | null
          id: string
          is_archived: boolean | null
          last_status_update: string | null
          milestones: Json | null
          name: string
          organization_id: string
          owner_id: string | null
          priority: string | null
          progress_percent: number | null
          project_type: string | null
          settings: Json | null
          sort_order: number | null
          source_decision_id: string | null
          source_opportunity_id: string | null
          spent: number | null
          start_date: string | null
          status: string | null
          status_summary: string | null
          suggested_contact_ids: string[] | null
          summary: string | null
          tags: string[] | null
          target_date: string | null
          tasks_completed: number | null
          tasks_total: number | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_contacts_matched_at?: string | null
          ai_context?: Json | null
          budget?: number | null
          client_name?: string | null
          color?: string | null
          completed_at?: string | null
          completed_date?: string | null
          conversation_count?: number | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: string | null
          description?: string | null
          emoji?: string | null
          goals?: string[] | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          last_status_update?: string | null
          milestones?: Json | null
          name: string
          organization_id: string
          owner_id?: string | null
          priority?: string | null
          progress_percent?: number | null
          project_type?: string | null
          settings?: Json | null
          sort_order?: number | null
          source_decision_id?: string | null
          source_opportunity_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          status_summary?: string | null
          suggested_contact_ids?: string[] | null
          summary?: string | null
          tags?: string[] | null
          target_date?: string | null
          tasks_completed?: number | null
          tasks_total?: number | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_contacts_matched_at?: string | null
          ai_context?: Json | null
          budget?: number | null
          client_name?: string | null
          color?: string | null
          completed_at?: string | null
          completed_date?: string | null
          conversation_count?: number | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: string | null
          description?: string | null
          emoji?: string | null
          goals?: string[] | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          last_status_update?: string | null
          milestones?: Json | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          priority?: string | null
          progress_percent?: number | null
          project_type?: string | null
          settings?: Json | null
          sort_order?: number | null
          source_decision_id?: string | null
          source_opportunity_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          status_summary?: string | null
          suggested_contact_ids?: string[] | null
          summary?: string | null
          tags?: string[] | null
          target_date?: string | null
          tasks_completed?: number | null
          tasks_total?: number | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_decision_id_fkey"
            columns: ["source_decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_opportunity_id_fkey"
            columns: ["source_opportunity_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      promises: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string | null
          direction: string
          due_date: string | null
          fulfilled_at: string | null
          id: string
          meeting_id: string | null
          notes: string | null
          promise_text: string
          promised_by: string | null
          promised_to: string | null
          reminder_sent: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          direction: string
          due_date?: string | null
          fulfilled_at?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          promise_text: string
          promised_by?: string | null
          promised_to?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          direction?: string
          due_date?: string | null
          fulfilled_at?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          promise_text?: string
          promised_by?: string | null
          promised_to?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promises_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      recognized_patterns: {
        Row: {
          conditions: Json | null
          confidence: number | null
          context_tags: string[] | null
          created_at: string | null
          evidence_sources: Json | null
          first_seen_at: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          occurrence_count: number | null
          organization_id: string
          pattern_data: Json
          pattern_description: string
          pattern_name: string
          pattern_type: string
          related_patterns: string[] | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          conditions?: Json | null
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          evidence_sources?: Json | null
          first_seen_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          occurrence_count?: number | null
          organization_id: string
          pattern_data: Json
          pattern_description: string
          pattern_name: string
          pattern_type: string
          related_patterns?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          conditions?: Json | null
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          evidence_sources?: Json | null
          first_seen_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          occurrence_count?: number | null
          organization_id?: string
          pattern_data?: Json
          pattern_description?: string
          pattern_name?: string
          pattern_type?: string
          related_patterns?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recognized_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_insights: {
        Row: {
          ai_recommendations: string[] | null
          communication_style: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          key_topics: string[] | null
          last_analyzed_at: string | null
          last_meeting_date: string | null
          meeting_frequency: string | null
          notes: string | null
          open_promises_count: number | null
          promises_kept_rate: number | null
          relationship_health: string | null
          total_meetings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_recommendations?: string[] | null
          communication_style?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          last_analyzed_at?: string | null
          last_meeting_date?: string | null
          meeting_frequency?: string | null
          notes?: string | null
          open_promises_count?: number | null
          promises_kept_rate?: number | null
          relationship_health?: string | null
          total_meetings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_recommendations?: string[] | null
          communication_style?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          last_analyzed_at?: string | null
          last_meeting_date?: string | null
          meeting_frequency?: string | null
          notes?: string | null
          open_promises_count?: number | null
          promises_kept_rate?: number | null
          relationship_health?: string | null
          total_meetings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          chat_id: string | null
          created_at: string | null
          delivery_channel: string | null
          id: string
          is_recurring: boolean | null
          message: string | null
          metadata: Json | null
          recurrence_rule: string | null
          remind_at: string | null
          sent_at: string | null
          snooze_until: string | null
          source: string | null
          status: string | null
          timezone: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          id?: string
          is_recurring?: boolean | null
          message?: string | null
          metadata?: Json | null
          recurrence_rule?: string | null
          remind_at?: string | null
          sent_at?: string | null
          snooze_until?: string | null
          source?: string | null
          status?: string | null
          timezone?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          id?: string
          is_recurring?: boolean | null
          message?: string | null
          metadata?: Json | null
          recurrence_rule?: string | null
          remind_at?: string | null
          sent_at?: string | null
          snooze_until?: string | null
          source?: string | null
          status?: string | null
          timezone?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      research_requests: {
        Row: {
          assigned_to: string | null
          confidence_score: number | null
          contact_id: string | null
          context: string | null
          created_at: string | null
          decision_id: string | null
          error_message: string | null
          estimated_hours: number | null
          executive_summary: string | null
          id: string
          key_findings: string[] | null
          n8n_workflow_id: string | null
          opportunity_id: string | null
          priority: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          project_id: string | null
          recommendations: string[] | null
          request_type: string
          research_output: Json | null
          sources: Json | null
          specific_questions: string[] | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          confidence_score?: number | null
          contact_id?: string | null
          context?: string | null
          created_at?: string | null
          decision_id?: string | null
          error_message?: string | null
          estimated_hours?: number | null
          executive_summary?: string | null
          id?: string
          key_findings?: string[] | null
          n8n_workflow_id?: string | null
          opportunity_id?: string | null
          priority?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          project_id?: string | null
          recommendations?: string[] | null
          request_type: string
          research_output?: Json | null
          sources?: Json | null
          specific_questions?: string[] | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          confidence_score?: number | null
          contact_id?: string | null
          context?: string | null
          created_at?: string | null
          decision_id?: string | null
          error_message?: string | null
          estimated_hours?: number | null
          executive_summary?: string | null
          id?: string
          key_findings?: string[] | null
          n8n_workflow_id?: string | null
          opportunity_id?: string | null
          priority?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          project_id?: string | null
          recommendations?: string[] | null
          request_type?: string
          research_output?: Json | null
          sources?: Json | null
          specific_questions?: string[] | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      risk_analyses: {
        Row: {
          analysis_date: string
          executive_summary: string | null
          generated_at: string | null
          id: string
          key_recommendations: string[] | null
          model_used: string | null
          organization_id: string
          overall_risk_level: string | null
          risk_items: Json
          tokens_used: number | null
        }
        Insert: {
          analysis_date?: string
          executive_summary?: string | null
          generated_at?: string | null
          id?: string
          key_recommendations?: string[] | null
          model_used?: string | null
          organization_id: string
          overall_risk_level?: string | null
          risk_items?: Json
          tokens_used?: number | null
        }
        Update: {
          analysis_date?: string
          executive_summary?: string | null
          generated_at?: string | null
          id?: string
          key_recommendations?: string[] | null
          model_used?: string | null
          organization_id?: string
          overall_risk_level?: string | null
          risk_items?: Json
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_deals: {
        Row: {
          actual_close_date: string | null
          ai_insights: Json | null
          ai_next_steps: string[] | null
          ai_score: number | null
          company_name: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          custom_fields: Json | null
          description: string | null
          expected_close_date: string | null
          id: string
          last_ai_analysis: string | null
          lost_reason: string | null
          my_portion: number | null
          name: string
          owner_id: string | null
          portion_percentage: number | null
          portion_type: string | null
          probability: number | null
          product_id: string | null
          source: string | null
          source_details: string | null
          source_id: string | null
          stage_id: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          value: number | null
          won_details: string | null
          workspace_id: string
        }
        Insert: {
          actual_close_date?: string | null
          ai_insights?: Json | null
          ai_next_steps?: string[] | null
          ai_score?: number | null
          company_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          last_ai_analysis?: string | null
          lost_reason?: string | null
          my_portion?: number | null
          name: string
          owner_id?: string | null
          portion_percentage?: number | null
          portion_type?: string | null
          probability?: number | null
          product_id?: string | null
          source?: string | null
          source_details?: string | null
          source_id?: string | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          value?: number | null
          won_details?: string | null
          workspace_id: string
        }
        Update: {
          actual_close_date?: string | null
          ai_insights?: Json | null
          ai_next_steps?: string[] | null
          ai_score?: number | null
          company_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          last_ai_analysis?: string | null
          lost_reason?: string | null
          my_portion?: number | null
          name?: string
          owner_id?: string | null
          portion_percentage?: number | null
          portion_type?: string | null
          probability?: number | null
          product_id?: string | null
          source?: string | null
          source_details?: string | null
          source_id?: string | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          value?: number | null
          won_details?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "sales_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          position: number
          probability: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          position?: number
          probability?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          position?: number
          probability?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      shared_conversations: {
        Row: {
          attached_document_ids: string[] | null
          context_type: string | null
          created_at: string
          created_by: string
          description: string | null
          document_id: string | null
          id: string
          is_archived: boolean | null
          is_private: boolean | null
          knowledge_space_id: string | null
          last_message_at: string | null
          message_count: number | null
          metadata: Json | null
          organization_id: string
          project_id: string | null
          rag_accessible_document_ids: string[] | null
          rag_scope: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          attached_document_ids?: string[] | null
          context_type?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          document_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_private?: boolean | null
          knowledge_space_id?: string | null
          last_message_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          organization_id: string
          project_id?: string | null
          rag_accessible_document_ids?: string[] | null
          rag_scope?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          attached_document_ids?: string[] | null
          context_type?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          document_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_private?: boolean | null
          knowledge_space_id?: string | null
          last_message_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          organization_id?: string
          project_id?: string | null
          rag_accessible_document_ids?: string[] | null
          rag_scope?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_conversations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_conversations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_conversations_knowledge_space_id_fkey"
            columns: ["knowledge_space_id"]
            isOneToOne: false
            referencedRelation: "knowledge_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_conversations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_credentials: {
        Row: {
          created_at: string | null
          credential_type: string
          encrypted_key: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          label: string | null
          last_used_at: string | null
          last_validated_at: string | null
          organization_id: string | null
          provider: string
          scopes: string[] | null
          updated_at: string | null
          user_id: string | null
          validation_error: string | null
        }
        Insert: {
          created_at?: string | null
          credential_type?: string
          encrypted_key: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          label?: string | null
          last_used_at?: string | null
          last_validated_at?: string | null
          organization_id?: string | null
          provider: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          validation_error?: string | null
        }
        Update: {
          created_at?: string | null
          credential_type?: string
          encrypted_key?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          label?: string | null
          last_used_at?: string | null
          last_validated_at?: string | null
          organization_id?: string | null
          provider?: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          validation_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_executions: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: string
          input: Json | null
          output: Json | null
          skill_id: string
          success: boolean | null
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          input?: Json | null
          output?: Json | null
          skill_id: string
          success?: boolean | null
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          input?: Json | null
          output?: Json | null
          skill_id?: string
          success?: boolean | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      slack_messages: {
        Row: {
          channel_id: string | null
          created_at: string | null
          direction: string
          id: string
          is_ai_response: boolean | null
          message_text: string | null
          message_ts: string | null
          metadata: Json | null
          slack_user_id: string | null
          team_id: string | null
          thread_ts: string | null
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          direction: string
          id?: string
          is_ai_response?: boolean | null
          message_text?: string | null
          message_ts?: string | null
          metadata?: Json | null
          slack_user_id?: string | null
          team_id?: string | null
          thread_ts?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          is_ai_response?: boolean | null
          message_text?: string | null
          message_ts?: string | null
          metadata?: Json | null
          slack_user_id?: string | null
          team_id?: string | null
          thread_ts?: string | null
          user_id?: string
        }
        Relationships: []
      }
      smart_collections: {
        Row: {
          collection_type: string
          color: string | null
          confidence: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_ids: string[] | null
          filter_rules: Json | null
          icon: string | null
          id: string
          is_pinned: boolean | null
          name: string
          organization_id: string
          topic_keywords: string[] | null
          updated_at: string | null
        }
        Insert: {
          collection_type?: string
          color?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_ids?: string[] | null
          filter_rules?: Json | null
          icon?: string | null
          id?: string
          is_pinned?: boolean | null
          name: string
          organization_id: string
          topic_keywords?: string[] | null
          updated_at?: string | null
        }
        Update: {
          collection_type?: string
          color?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_ids?: string[] | null
          filter_rules?: Json | null
          icon?: string | null
          id?: string
          is_pinned?: boolean | null
          name?: string
          organization_id?: string
          topic_keywords?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          area: string
          details: Json | null
          failed_operations: number | null
          id: string
          last_error: string | null
          last_failure_at: string | null
          last_success_at: string | null
          organization_id: string
          pending_operations: number | null
          recorded_at: string | null
          status: string
          successful_operations: number | null
          total_operations: number | null
        }
        Insert: {
          area: string
          details?: Json | null
          failed_operations?: number | null
          id?: string
          last_error?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          organization_id: string
          pending_operations?: number | null
          recorded_at?: string | null
          status: string
          successful_operations?: number | null
          total_operations?: number | null
        }
        Update: {
          area?: string
          details?: Json | null
          failed_operations?: number | null
          id?: string
          last_error?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          organization_id?: string
          pending_operations?: number | null
          recorded_at?: string | null
          status?: string
          successful_operations?: number | null
          total_operations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "system_health_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_deliverables: {
        Row: {
          ai_generated: boolean | null
          ai_model: string | null
          ai_prompt_context: string | null
          content: string
          content_type: string
          created_at: string | null
          format: string | null
          id: string
          metadata: Json | null
          parent_id: string | null
          platform: string | null
          published_at: string | null
          status: string | null
          task_id: string
          title: string | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt_context?: string | null
          content: string
          content_type: string
          created_at?: string | null
          format?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          platform?: string | null
          published_at?: string | null
          status?: string | null
          task_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt_context?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          format?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          platform?: string | null
          published_at?: string | null
          status?: string | null
          task_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_deliverables_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_deliverables_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_nudge_opportunities"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_deliverables_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_health_flags: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          ai_analysis: string | null
          ai_confidence: number | null
          ai_suggestion: string | null
          created_at: string | null
          description: string | null
          detected_at: string | null
          flag_type: string
          id: string
          organization_id: string
          person_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          task_id: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_analysis?: string | null
          ai_confidence?: number | null
          ai_suggestion?: string | null
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          flag_type: string
          id?: string
          organization_id: string
          person_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          task_id?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_analysis?: string | null
          ai_confidence?: number | null
          ai_suggestion?: string | null
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          flag_type?: string
          id?: string
          organization_id?: string
          person_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_health_flags_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_health_flags_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_health_flags_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_health_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_health_flags_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_health_flags_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_health_flags_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_health_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_health_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_health_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_duration_minutes: number | null
          agent_id: string | null
          ai_confidence: number | null
          ai_context: string | null
          assigned_by: string | null
          assigned_to: string | null
          assigned_to_id: string | null
          assigned_to_type: string | null
          automation_rules: Json | null
          blocked_at: string | null
          blocked_reason: string | null
          brand_id: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          decision_id: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          estimated_duration_minutes: number | null
          execution_log: Json | null
          execution_status: string | null
          execution_type: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          max_retries: number | null
          organization_id: string
          parent_task_id: string | null
          priority: string
          project: string | null
          project_id: string | null
          retry_count: number | null
          source: string | null
          source_reference: string | null
          started_at: string | null
          status: string
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          agent_id?: string | null
          ai_confidence?: number | null
          ai_context?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          assigned_to_id?: string | null
          assigned_to_type?: string | null
          automation_rules?: Json | null
          blocked_at?: string | null
          blocked_reason?: string | null
          brand_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          decision_id?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          estimated_duration_minutes?: number | null
          execution_log?: Json | null
          execution_status?: string | null
          execution_type?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          max_retries?: number | null
          organization_id: string
          parent_task_id?: string | null
          priority?: string
          project?: string | null
          project_id?: string | null
          retry_count?: number | null
          source?: string | null
          source_reference?: string | null
          started_at?: string | null
          status?: string
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          agent_id?: string | null
          ai_confidence?: number | null
          ai_context?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          assigned_to_id?: string | null
          assigned_to_type?: string | null
          automation_rules?: Json | null
          blocked_at?: string | null
          blocked_reason?: string | null
          brand_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          decision_id?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          estimated_duration_minutes?: number | null
          execution_log?: Json | null
          execution_status?: string | null
          execution_type?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          max_retries?: number | null
          organization_id?: string
          parent_task_id?: string | null
          priority?: string
          project?: string | null
          project_id?: string | null
          retry_count?: number | null
          source?: string | null
          source_reference?: string | null
          started_at?: string | null
          status?: string
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "pending_nudge_opportunities"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_preparations: {
        Row: {
          ai_application: Json | null
          ai_illustrations: Json | null
          ai_research: Json | null
          application_points: string | null
          created_at: string | null
          delivery_date: string | null
          id: string
          illustrations: string | null
          main_points: Json | null
          ministry_event_id: string | null
          outline: string | null
          scripture_references: string[] | null
          status: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_application?: Json | null
          ai_illustrations?: Json | null
          ai_research?: Json | null
          application_points?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          illustrations?: string | null
          main_points?: Json | null
          ministry_event_id?: string | null
          outline?: string | null
          scripture_references?: string[] | null
          status?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_application?: Json | null
          ai_illustrations?: Json | null
          ai_research?: Json | null
          application_points?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          illustrations?: string | null
          main_points?: Json | null
          ministry_event_id?: string | null
          outline?: string | null
          scripture_references?: string[] | null
          status?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_preparations_ministry_event_id_fkey"
            columns: ["ministry_event_id"]
            isOneToOne: false
            referencedRelation: "ministry_events"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          resource_id: string | null
          resource_title: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_title?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_title?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_analytics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          organization_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_consulting_advisors: {
        Row: {
          added_at: string | null
          added_by: string | null
          advisor_id: string
          id: string
          notes: string | null
          team_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          advisor_id: string
          id?: string
          notes?: string | null
          team_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          advisor_id?: string
          id?: string
          notes?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_consulting_advisors_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_consulting_advisors_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_group_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          group_id: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          group_id: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          group_id?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "team_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_groups: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          can_edit_settings: boolean | null
          can_manage_members: boolean | null
          can_manage_projects: boolean | null
          can_view_analytics: boolean | null
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          can_edit_settings?: boolean | null
          can_manage_members?: boolean | null
          can_manage_projects?: boolean | null
          can_view_analytics?: boolean | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          can_edit_settings?: boolean | null
          can_manage_members?: boolean | null
          can_manage_projects?: boolean | null
          can_view_analytics?: boolean | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          ai_context: Json | null
          color: string | null
          created_at: string
          created_by: string | null
          dashboard_config: Json | null
          description: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          name: string
          organization_id: string
          parent_team_id: string | null
          primary_advisor_id: string | null
          slug: string
          sort_order: number | null
          team_type: string
          template_id: string | null
          updated_at: string
          workflow_stages: Json | null
        }
        Insert: {
          ai_context?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          dashboard_config?: Json | null
          description?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          organization_id: string
          parent_team_id?: string | null
          primary_advisor_id?: string | null
          slug: string
          sort_order?: number | null
          team_type?: string
          template_id?: string | null
          updated_at?: string
          workflow_stages?: Json | null
        }
        Update: {
          ai_context?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          dashboard_config?: Json | null
          description?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          organization_id?: string
          parent_team_id?: string | null
          primary_advisor_id?: string | null
          slug?: string
          sort_order?: number | null
          team_type?: string
          template_id?: string | null
          updated_at?: string
          workflow_stages?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_primary_advisor_id_fkey"
            columns: ["primary_advisor_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_interactions: {
        Row: {
          action_id: string | null
          action_type: string | null
          chat_id: string | null
          created_at: string | null
          extracted_data: Json | null
          id: string
          intent: string | null
          message: string | null
          response: string | null
          response_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          action_id?: string | null
          action_type?: string | null
          chat_id?: string | null
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          intent?: string | null
          message?: string | null
          response?: string | null
          response_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          action_id?: string | null
          action_type?: string | null
          chat_id?: string | null
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          intent?: string | null
          message?: string | null
          response?: string | null
          response_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      uplift_agreement_signatures: {
        Row: {
          agreement_type: string
          id: string
          signed_at: string | null
          user_id: string
        }
        Insert: {
          agreement_type: string
          id?: string
          signed_at?: string | null
          user_id: string
        }
        Update: {
          agreement_type?: string
          id?: string
          signed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_agreement_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          org_id: string | null
          project_id: string | null
          role: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "uplift_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_checkins: {
        Row: {
          blockers: string | null
          checkin_date: string
          created_at: string | null
          energy_level: number | null
          id: string
          mood: string | null
          needs_help: boolean | null
          notes: string | null
          org_id: string | null
          today_plans: string | null
          user_id: string
          yesterday_accomplishments: string | null
        }
        Insert: {
          blockers?: string | null
          checkin_date?: string
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          needs_help?: boolean | null
          notes?: string | null
          org_id?: string | null
          today_plans?: string | null
          user_id: string
          yesterday_accomplishments?: string | null
        }
        Update: {
          blockers?: string | null
          checkin_date?: string
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          needs_help?: boolean | null
          notes?: string | null
          org_id?: string | null
          today_plans?: string | null
          user_id?: string
          yesterday_accomplishments?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uplift_checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "uplift_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_onboarding_tasks: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          order_index: number | null
          required: boolean | null
          resource_url: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          required?: boolean | null
          resource_url?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          required?: boolean | null
          resource_url?: string | null
          title?: string
        }
        Relationships: []
      }
      uplift_one_on_ones: {
        Row: {
          action_items: string | null
          created_at: string | null
          id: string
          manager_id: string | null
          meeting_date: string
          mood_observed: string | null
          notes: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          meeting_date: string
          mood_observed?: string | null
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          meeting_date?: string
          mood_observed?: string | null
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_one_on_ones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      uplift_orientation_progress: {
        Row: {
          completed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_orientation_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_reviews: {
        Row: {
          accomplishments: string | null
          acknowledged_at: string | null
          areas_for_improvement: string | null
          created_at: string | null
          goals_next_period: string | null
          id: string
          org_id: string | null
          overall_rating: number | null
          period_end: string | null
          period_start: string | null
          rating_communication: number | null
          rating_growth: number | null
          rating_initiative: number | null
          rating_quality: number | null
          rating_reliability: number | null
          review_date: string
          review_type: string
          reviewer_id: string
          reviewer_notes: string | null
          self_assessment: string | null
          self_rating: number | null
          status: string | null
          strengths: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accomplishments?: string | null
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          created_at?: string | null
          goals_next_period?: string | null
          id?: string
          org_id?: string | null
          overall_rating?: number | null
          period_end?: string | null
          period_start?: string | null
          rating_communication?: number | null
          rating_growth?: number | null
          rating_initiative?: number | null
          rating_quality?: number | null
          rating_reliability?: number | null
          review_date?: string
          review_type: string
          reviewer_id: string
          reviewer_notes?: string | null
          self_assessment?: string | null
          self_rating?: number | null
          status?: string | null
          strengths?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accomplishments?: string | null
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          created_at?: string | null
          goals_next_period?: string | null
          id?: string
          org_id?: string | null
          overall_rating?: number | null
          period_end?: string | null
          period_start?: string | null
          rating_communication?: number | null
          rating_growth?: number | null
          rating_initiative?: number | null
          rating_quality?: number | null
          rating_reliability?: number | null
          review_date?: string
          review_type?: string
          reviewer_id?: string
          reviewer_notes?: string | null
          self_assessment?: string | null
          self_rating?: number | null
          status?: string | null
          strengths?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "uplift_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billable: boolean | null
          category: string
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          org_id: string | null
          project_id: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean | null
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          hours: number
          id?: string
          org_id?: string | null
          project_id?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          org_id?: string | null
          project_id?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_time_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "uplift_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_user_documents: {
        Row: {
          category: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_user_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_user_onboarding: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_user_onboarding_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "uplift_onboarding_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_user_orgs: {
        Row: {
          id: string
          is_primary: boolean | null
          joined_at: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_user_orgs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "uplift_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uplift_user_orgs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      uplift_users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          emergency_contact: Json | null
          end_date: string | null
          full_name: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          onboarding_completed_at: string | null
          phone: string | null
          role: string
          skills: string[] | null
          start_date: string | null
          status: string
          timezone: string | null
          updated_at: string | null
          weekly_hour_target: number | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          emergency_contact?: Json | null
          end_date?: string | null
          full_name: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          role?: string
          skills?: string[] | null
          start_date?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string | null
          weekly_hour_target?: number | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          emergency_contact?: Json | null
          end_date?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          role?: string
          skills?: string[] | null
          start_date?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string | null
          weekly_hour_target?: number | null
        }
        Relationships: []
      }
      uplift_workspace_setup: {
        Row: {
          completed_at: string | null
          id: string
          setup_item: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          setup_item: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          setup_item?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uplift_workspace_setup_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          feature: string
          id: string
          metadata: Json | null
          organization_id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          feature: string
          id?: string
          metadata?: Json | null
          organization_id: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          feature?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_meters: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          current_usage: number | null
          id: string
          included_quota: number | null
          last_synced_to_stripe: string | null
          last_synced_usage: number | null
          meter_type: string
          organization_id: string
          overage_cost: number | null
          overage_price_per_unit: number | null
          overage_units: number | null
          stripe_meter_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          current_usage?: number | null
          id?: string
          included_quota?: number | null
          last_synced_to_stripe?: string | null
          last_synced_usage?: number | null
          meter_type: string
          organization_id: string
          overage_cost?: number | null
          overage_price_per_unit?: number | null
          overage_units?: number | null
          stripe_meter_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          current_usage?: number | null
          id?: string
          included_quota?: number | null
          last_synced_to_stripe?: string | null
          last_synced_usage?: number | null
          meter_type?: string
          organization_id?: string
          overage_cost?: number | null
          overage_price_per_unit?: number | null
          overage_units?: number | null
          stripe_meter_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_meters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_memory: {
        Row: {
          brand_id: string | null
          confidence: number | null
          content: string
          created_at: string | null
          entity_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          key: string | null
          last_reinforced_at: string | null
          learned_at: string | null
          memory_type: string
          organization_id: string | null
          reinforcement_count: number | null
          source: string | null
          source_id: string | null
          updated_at: string | null
          user_id: string
          value: Json | null
        }
        Insert: {
          brand_id?: string | null
          confidence?: number | null
          content: string
          created_at?: string | null
          entity_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          key?: string | null
          last_reinforced_at?: string | null
          learned_at?: string | null
          memory_type: string
          organization_id?: string | null
          reinforcement_count?: number | null
          source?: string | null
          source_id?: string | null
          updated_at?: string | null
          user_id: string
          value?: Json | null
        }
        Update: {
          brand_id?: string | null
          confidence?: number | null
          content?: string
          created_at?: string | null
          entity_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          key?: string | null
          last_reinforced_at?: string | null
          learned_at?: string | null
          memory_type?: string
          organization_id?: string | null
          reinforcement_count?: number | null
          source?: string | null
          source_id?: string | null
          updated_at?: string | null
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_memory_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ai_memory_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ai_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_quotas: {
        Row: {
          allowed_models: string[] | null
          can_use_premium_models: boolean | null
          cost_spent_this_month: number | null
          created_at: string | null
          last_reset_date: string | null
          max_cost_per_month: number | null
          max_tokens_per_day: number
          max_tokens_per_month: number
          month_start_date: string | null
          organization_id: string
          tier: string
          tokens_used_this_month: number | null
          tokens_used_today: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_models?: string[] | null
          can_use_premium_models?: boolean | null
          cost_spent_this_month?: number | null
          created_at?: string | null
          last_reset_date?: string | null
          max_cost_per_month?: number | null
          max_tokens_per_day?: number
          max_tokens_per_month?: number
          month_start_date?: string | null
          organization_id: string
          tier?: string
          tokens_used_this_month?: number | null
          tokens_used_today?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_models?: string[] | null
          can_use_premium_models?: boolean | null
          cost_spent_this_month?: number | null
          created_at?: string | null
          last_reset_date?: string | null
          max_cost_per_month?: number | null
          max_tokens_per_day?: number
          max_tokens_per_month?: number
          month_start_date?: string | null
          organization_id?: string
          tier?: string
          tokens_used_this_month?: number | null
          tokens_used_today?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_quotas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_usage: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          date: string
          id: string
          input_tokens: number
          model: string
          organization_id: string
          output_tokens: number
          selected_by_routing: boolean | null
          task_type: string | null
          total_cost: number
          total_tokens: number | null
          user_id: string
          was_auto_selected: boolean | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          input_tokens: number
          model: string
          organization_id: string
          output_tokens: number
          selected_by_routing?: boolean | null
          task_type?: string | null
          total_cost: number
          total_tokens?: number | null
          user_id: string
          was_auto_selected?: boolean | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          input_tokens?: number
          model?: string
          organization_id?: string
          output_tokens?: number
          selected_by_routing?: boolean | null
          task_type?: string | null
          total_cost?: number
          total_tokens?: number | null
          user_id?: string
          was_auto_selected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          integration_id: string
          is_connected: boolean | null
          refresh_token: string | null
          settings: Json | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_id: string
          is_connected?: boolean | null
          refresh_token?: string | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_id?: string
          is_connected?: boolean | null
          refresh_token?: string | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          expires_at: string | null
          granted: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          resource_id: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          resource_id?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          confidence: number | null
          context_tags: string[] | null
          created_at: string | null
          evidence_count: number | null
          id: string
          is_active: boolean | null
          is_explicit: boolean | null
          last_used_at: string | null
          organization_id: string
          preference_key: string
          preference_type: string
          preference_value: Json
          sources: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          evidence_count?: number | null
          id?: string
          is_active?: boolean | null
          is_explicit?: boolean | null
          last_used_at?: string | null
          organization_id: string
          preference_key: string
          preference_type: string
          preference_value: Json
          sources?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          context_tags?: string[] | null
          created_at?: string | null
          evidence_count?: number | null
          id?: string
          is_active?: boolean | null
          is_explicit?: boolean | null
          last_used_at?: string | null
          organization_id?: string
          preference_key?: string
          preference_type?: string
          preference_value?: Json
          sources?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_typing_in: string | null
          last_seen_at: string | null
          status: string | null
          status_message: string | null
          typing_started_at: string | null
          user_id: string
        }
        Insert: {
          is_typing_in?: string | null
          last_seen_at?: string | null
          status?: string | null
          status_message?: string | null
          typing_started_at?: string | null
          user_id: string
        }
        Update: {
          is_typing_in?: string | null
          last_seen_at?: string | null
          status?: string | null
          status_message?: string | null
          typing_started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_is_typing_in_fkey"
            columns: ["is_typing_in"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "uplift_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          config: Json | null
          enabled: boolean | null
          id: string
          installed_at: string | null
          last_used_at: string | null
          skill_id: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          enabled?: boolean | null
          id?: string
          installed_at?: string | null
          last_used_at?: string | null
          skill_id: string
          user_id: string
        }
        Update: {
          config?: Json | null
          enabled?: boolean | null
          id?: string
          installed_at?: string | null
          last_used_at?: string | null
          skill_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_workspaces: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_memos: {
        Row: {
          ai_extracted_contacts: string[] | null
          ai_extracted_tasks: Json | null
          ai_suggested_meeting_type: string | null
          ai_summary: string | null
          audio_url: string | null
          converted_to_meeting_id: string | null
          converted_to_task_id: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          processing_status: string | null
          project_tags: string[] | null
          recorded_at: string | null
          title: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          ai_extracted_contacts?: string[] | null
          ai_extracted_tasks?: Json | null
          ai_suggested_meeting_type?: string | null
          ai_summary?: string | null
          audio_url?: string | null
          converted_to_meeting_id?: string | null
          converted_to_task_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          processing_status?: string | null
          project_tags?: string[] | null
          recorded_at?: string | null
          title?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          ai_extracted_contacts?: string[] | null
          ai_extracted_tasks?: Json | null
          ai_suggested_meeting_type?: string | null
          ai_summary?: string | null
          audio_url?: string | null
          converted_to_meeting_id?: string | null
          converted_to_task_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          processing_status?: string | null
          project_tags?: string[] | null
          recorded_at?: string | null
          title?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_memos_converted_to_meeting_id_fkey"
            columns: ["converted_to_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      web_clips: {
        Row: {
          author: string | null
          canonical_url: string | null
          capture_method: string | null
          captured_at: string | null
          created_at: string | null
          document_id: string
          domain: string | null
          excerpt: string | null
          id: string
          language: string | null
          main_content: string | null
          og_description: string | null
          og_image: string | null
          organization_id: string
          published_date: string | null
          reading_time_minutes: number | null
          source_url: string
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          capture_method?: string | null
          captured_at?: string | null
          created_at?: string | null
          document_id: string
          domain?: string | null
          excerpt?: string | null
          id?: string
          language?: string | null
          main_content?: string | null
          og_description?: string | null
          og_image?: string | null
          organization_id: string
          published_date?: string | null
          reading_time_minutes?: number | null
          source_url: string
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          capture_method?: string | null
          captured_at?: string | null
          created_at?: string | null
          document_id?: string
          domain?: string | null
          excerpt?: string | null
          id?: string
          language?: string | null
          main_content?: string | null
          og_description?: string | null
          og_image?: string | null
          organization_id?: string
          published_date?: string | null
          reading_time_minutes?: number | null
          source_url?: string
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "web_clips_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_clips_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_clips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          max_attempts: number | null
          next_retry_at: string | null
          organization_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          response_time_ms: number | null
          status: string
          updated_at: string | null
          webhook_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          organization_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          status?: string
          updated_at?: string | null
          webhook_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          status?: string
          updated_at?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_event_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          payload_schema: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payload_schema?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payload_schema?: Json | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          event_type: string | null
          id: string
          ip_address: string | null
          payload: Json
          processed_at: string | null
          processed_meeting_id: string | null
          processing_status: string | null
          received_at: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          payload: Json
          processed_at?: string | null
          processed_meeting_id?: string | null
          processing_status?: string | null
          received_at?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json
          processed_at?: string | null
          processed_meeting_id?: string | null
          processing_status?: string | null
          received_at?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_processed_meeting_id_fkey"
            columns: ["processed_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          name: string
          organization_id: string
          retry_count: number | null
          secret: string
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          name: string
          organization_id: string
          retry_count?: number | null
          secret: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          name?: string
          organization_id?: string
          retry_count?: number | null
          secret?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string
          created_at: string | null
          direction: string
          from_number: string
          id: string
          organization_id: string
          status: string | null
          to_number: string
          twilio_message_sid: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          direction: string
          from_number: string
          id?: string
          organization_id: string
          status?: string | null
          to_number: string
          twilio_message_sid?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          direction?: string
          from_number?: string
          id?: string
          organization_id?: string
          status?: string | null
          to_number?: string
          twilio_message_sid?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      white_label_configs: {
        Row: {
          accent_color: string | null
          company_name: string | null
          created_at: string | null
          custom_css: string | null
          custom_domain: string | null
          custom_footer_text: string | null
          domain_verification_token: string | null
          domain_verified: boolean | null
          domain_verified_at: string | null
          favicon_url: string | null
          footer_links: Json | null
          hide_powered_by: boolean | null
          id: string
          is_active: boolean | null
          login_background_url: string | null
          logo_dark_url: string | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          support_email: string | null
          support_url: string | null
          tagline: string | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          accent_color?: string | null
          company_name?: string | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          custom_footer_text?: string | null
          domain_verification_token?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          favicon_url?: string | null
          footer_links?: Json | null
          hide_powered_by?: boolean | null
          id?: string
          is_active?: boolean | null
          login_background_url?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          support_email?: string | null
          support_url?: string | null
          tagline?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          accent_color?: string | null
          company_name?: string | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          custom_footer_text?: string | null
          domain_verification_token?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          favicon_url?: string | null
          footer_links?: Json | null
          hide_powered_by?: boolean | null
          id?: string
          is_active?: boolean | null
          login_background_url?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          support_email?: string | null
          support_url?: string | null
          tagline?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "white_label_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_attachments: {
        Row: {
          created_at: string
          description: string | null
          document_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          storage_path: string | null
          uploaded_by: string | null
          work_item_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          storage_path?: string | null
          uploaded_by?: string | null
          work_item_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          storage_path?: string | null
          uploaded_by?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "accessible_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_attachments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_comments: {
        Row: {
          author_id: string | null
          comment_type: string | null
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_internal: boolean | null
          mentioned_user_ids: string[] | null
          updated_at: string
          work_item_id: string
        }
        Insert: {
          author_id?: string | null
          comment_type?: string | null
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean | null
          mentioned_user_ids?: string[] | null
          updated_at?: string
          work_item_id: string
        }
        Update: {
          author_id?: string | null
          comment_type?: string | null
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean | null
          mentioned_user_ids?: string[] | null
          updated_at?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_item_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_comments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_history: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          comment: string | null
          created_at: string
          event_type: string
          field_name: string | null
          from_stage_id: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          to_stage_id: string | null
          work_item_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          comment?: string | null
          created_at?: string
          event_type: string
          field_name?: string | null
          from_stage_id?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          to_stage_id?: string | null
          work_item_id: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          comment?: string | null
          created_at?: string
          event_type?: string
          field_name?: string | null
          from_stage_id?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          to_stage_id?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_item_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_history_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          ai_analyzed_at: string | null
          ai_insights: Json | null
          ai_model_used: string | null
          ai_recommendations: string[] | null
          ai_score: number | null
          archived_at: string | null
          archived_by: string | null
          assigned_at: string | null
          assigned_to: string | null
          brand_audience_fit: number | null
          brand_composite_score: number | null
          brand_longterm_impact: number | null
          brand_quality_standards: number | null
          brand_values_alignment: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_stage_id: string
          custom_fields: Json | null
          decision_by: string | null
          decision_date: string | null
          decision_notes: string | null
          description: string | null
          due_date: string | null
          estimated_value: number | null
          exception_flagged_at: string | null
          exception_flagged_by: string | null
          exception_reason: string | null
          exception_resolved_at: string | null
          exception_resolved_by: string | null
          external_id: string | null
          final_decision: string | null
          hurdle_category: string | null
          hurdle_rate_score: number | null
          id: string
          is_archived: boolean | null
          is_exception: boolean | null
          item_type: string
          metadata: Json | null
          opportunity_source: string | null
          opportunity_type: string | null
          organization_id: string
          previous_stage_id: string | null
          priority: string | null
          probability_percent: number | null
          resource_capital_required: number | null
          resource_composite_score: number | null
          resource_energy_required: number | null
          resource_opportunity_cost: number | null
          resource_time_required: number | null
          risk_composite_score: number | null
          risk_financial: number | null
          risk_legal: number | null
          risk_operational: number | null
          risk_reputational: number | null
          score_recommendation: string | null
          source: string | null
          source_reference: string | null
          strategic_competencies_match: number | null
          strategic_composite_score: number | null
          strategic_future_opportunities: number | null
          strategic_goals_alignment: number | null
          strategic_revenue_diversification: number | null
          tags: string[] | null
          team_id: string
          title: string
          updated_at: string
          weighted_composite_score: number | null
        }
        Insert: {
          ai_analyzed_at?: string | null
          ai_insights?: Json | null
          ai_model_used?: string | null
          ai_recommendations?: string[] | null
          ai_score?: number | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brand_audience_fit?: number | null
          brand_composite_score?: number | null
          brand_longterm_impact?: number | null
          brand_quality_standards?: number | null
          brand_values_alignment?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_stage_id: string
          custom_fields?: Json | null
          decision_by?: string | null
          decision_date?: string | null
          decision_notes?: string | null
          description?: string | null
          due_date?: string | null
          estimated_value?: number | null
          exception_flagged_at?: string | null
          exception_flagged_by?: string | null
          exception_reason?: string | null
          exception_resolved_at?: string | null
          exception_resolved_by?: string | null
          external_id?: string | null
          final_decision?: string | null
          hurdle_category?: string | null
          hurdle_rate_score?: number | null
          id?: string
          is_archived?: boolean | null
          is_exception?: boolean | null
          item_type: string
          metadata?: Json | null
          opportunity_source?: string | null
          opportunity_type?: string | null
          organization_id: string
          previous_stage_id?: string | null
          priority?: string | null
          probability_percent?: number | null
          resource_capital_required?: number | null
          resource_composite_score?: number | null
          resource_energy_required?: number | null
          resource_opportunity_cost?: number | null
          resource_time_required?: number | null
          risk_composite_score?: number | null
          risk_financial?: number | null
          risk_legal?: number | null
          risk_operational?: number | null
          risk_reputational?: number | null
          score_recommendation?: string | null
          source?: string | null
          source_reference?: string | null
          strategic_competencies_match?: number | null
          strategic_composite_score?: number | null
          strategic_future_opportunities?: number | null
          strategic_goals_alignment?: number | null
          strategic_revenue_diversification?: number | null
          tags?: string[] | null
          team_id: string
          title: string
          updated_at?: string
          weighted_composite_score?: number | null
        }
        Update: {
          ai_analyzed_at?: string | null
          ai_insights?: Json | null
          ai_model_used?: string | null
          ai_recommendations?: string[] | null
          ai_score?: number | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brand_audience_fit?: number | null
          brand_composite_score?: number | null
          brand_longterm_impact?: number | null
          brand_quality_standards?: number | null
          brand_values_alignment?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_stage_id?: string
          custom_fields?: Json | null
          decision_by?: string | null
          decision_date?: string | null
          decision_notes?: string | null
          description?: string | null
          due_date?: string | null
          estimated_value?: number | null
          exception_flagged_at?: string | null
          exception_flagged_by?: string | null
          exception_reason?: string | null
          exception_resolved_at?: string | null
          exception_resolved_by?: string | null
          external_id?: string | null
          final_decision?: string | null
          hurdle_category?: string | null
          hurdle_rate_score?: number | null
          id?: string
          is_archived?: boolean | null
          is_exception?: boolean | null
          item_type?: string
          metadata?: Json | null
          opportunity_source?: string | null
          opportunity_type?: string | null
          organization_id?: string
          previous_stage_id?: string | null
          priority?: string | null
          probability_percent?: number | null
          resource_capital_required?: number | null
          resource_composite_score?: number | null
          resource_energy_required?: number | null
          resource_opportunity_cost?: number | null
          resource_time_required?: number | null
          risk_composite_score?: number | null
          risk_financial?: number | null
          risk_legal?: number | null
          risk_operational?: number | null
          risk_reputational?: number | null
          score_recommendation?: string | null
          source?: string | null
          source_reference?: string | null
          strategic_competencies_match?: number | null
          strategic_composite_score?: number | null
          strategic_future_opportunities?: number | null
          strategic_goals_alignment?: number | null
          strategic_revenue_diversification?: number | null
          tags?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
          weighted_composite_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_items_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_items_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_items_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_exception_flagged_by_fkey"
            columns: ["exception_flagged_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_items_exception_flagged_by_fkey"
            columns: ["exception_flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_exception_flagged_by_fkey"
            columns: ["exception_flagged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_exception_resolved_by_fkey"
            columns: ["exception_resolved_by"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_items_exception_resolved_by_fkey"
            columns: ["exception_resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_exception_resolved_by_fkey"
            columns: ["exception_resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          execution_id: string
          id: string
          input_data: Json | null
          node_id: string
          node_type: string
          output_data: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_id: string
          id?: string
          input_data?: Json | null
          node_id: string
          node_type: string
          output_data?: Json | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string
          id?: string
          input_data?: Json | null
          node_id?: string
          node_type?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_node_id: string | null
          duration_ms: number | null
          error_message: string | null
          error_node_id: string | null
          id: string
          input_data: Json | null
          node_results: Json | null
          organization_id: string
          output_data: Json | null
          started_at: string | null
          status: string
          triggered_by: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_node_id?: string | null
          id?: string
          input_data?: Json | null
          node_results?: Json | null
          organization_id: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_node_id?: string | null
          id?: string
          input_data?: Json | null
          node_results?: Json | null
          organization_id?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schedules: {
        Row: {
          created_at: string | null
          cron_expression: string
          enabled: boolean | null
          id: string
          last_run_at: string | null
          next_run_at: string | null
          organization_id: string
          timezone: string | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          cron_expression: string
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id: string
          timezone?: string | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          cron_expression?: string
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string
          timezone?: string | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_schedules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          assistant_id: string | null
          completed_at: string | null
          config: Json
          conversation_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          execution_id: string
          id: string
          input_data: Json | null
          output_data: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          step_index: number
          step_name: string
          step_type: string
          workflow_id: string
        }
        Insert: {
          assistant_id?: string | null
          completed_at?: string | null
          config?: Json
          conversation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_id: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          step_index: number
          step_name: string
          step_type: string
          workflow_id: string
        }
        Update: {
          assistant_id?: string | null
          completed_at?: string | null
          config?: Json
          conversation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          step_index?: number
          step_name?: string
          step_type?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "ai_assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string | null
          created_at: string | null
          default_trigger_type: string | null
          description: string | null
          edges: Json
          estimated_duration: string | null
          example_input: Json | null
          example_output: Json | null
          icon: string | null
          id: string
          is_popular: boolean | null
          name: string
          nodes: Json
          usage_count: number | null
          use_cases: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_trigger_type?: string | null
          description?: string | null
          edges?: Json
          estimated_duration?: string | null
          example_input?: Json | null
          example_output?: Json | null
          icon?: string | null
          id?: string
          is_popular?: boolean | null
          name: string
          nodes?: Json
          usage_count?: number | null
          use_cases?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_trigger_type?: string | null
          description?: string | null
          edges?: Json
          estimated_duration?: string | null
          example_input?: Json | null
          example_output?: Json | null
          icon?: string | null
          id?: string
          is_popular?: boolean | null
          name?: string
          nodes?: Json
          usage_count?: number | null
          use_cases?: Json | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          edges: Json
          enabled: boolean | null
          failed_runs: number | null
          icon: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          last_run_at: string | null
          max_retries: number | null
          name: string
          nodes: Json
          organization_id: string
          successful_runs: number | null
          timeout_seconds: number | null
          total_runs: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          edges?: Json
          enabled?: boolean | null
          failed_runs?: number | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          last_run_at?: string | null
          max_retries?: number | null
          name: string
          nodes?: Json
          organization_id: string
          successful_runs?: number | null
          timeout_seconds?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          edges?: Json
          enabled?: boolean | null
          failed_runs?: number | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          last_run_at?: string | null
          max_retries?: number | null
          name?: string
          nodes?: Json
          organization_id?: string
          successful_runs?: number | null
          timeout_seconds?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      accessible_documents: {
        Row: {
          access_type: string | null
          can_edit_shared: boolean | null
          content: string | null
          created_at: string | null
          document_type: string | null
          embedding: string | null
          error_message: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          folder_id: string | null
          id: string | null
          key_points: Json | null
          metadata: Json | null
          organization_id: string | null
          shared_by: string | null
          shared_by_name: string | null
          status: string | null
          summary: string | null
          summary_cost_usd: number | null
          summary_generated_at: string | null
          summary_tokens_used: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_stats: {
        Row: {
          conversation_id: string | null
          last_message_at: string | null
          message_count: number | null
          organization_id: string | null
          participant_count: number | null
          title: string | null
          total_cost_usd: number | null
          total_tokens_used: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_ai_usage_summary: {
        Row: {
          date: string | null
          model: string | null
          total_cost: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      ecosystem_overview: {
        Row: {
          active_users_24h: number | null
          app_name: string | null
          app_slug: string | null
          app_url: string | null
          donations_mtd: number | null
          events_last_24h: number | null
          is_active: boolean | null
          last_event_at: string | null
          revenue_mtd: number | null
          synced_contacts: number | null
        }
        Insert: {
          active_users_24h?: never
          app_name?: string | null
          app_slug?: string | null
          app_url?: string | null
          donations_mtd?: never
          events_last_24h?: never
          is_active?: boolean | null
          last_event_at?: string | null
          revenue_mtd?: never
          synced_contacts?: never
        }
        Update: {
          active_users_24h?: never
          app_name?: string | null
          app_slug?: string | null
          app_url?: string | null
          donations_mtd?: never
          events_last_24h?: never
          is_active?: boolean | null
          last_event_at?: string | null
          revenue_mtd?: never
          synced_contacts?: never
        }
        Relationships: []
      }
      knowledge_contributor_stats: {
        Row: {
          conversations_contributed: number | null
          documents_contributed: number | null
          email: string | null
          full_name: string | null
          organization_id: string | null
          total_contributions: number | null
          total_helpful_votes: number | null
          total_shares: number | null
          total_views: number | null
          training_contributed: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      open_promises_view: {
        Row: {
          created_at: string | null
          deadline: string | null
          direction: string | null
          fulfilled_at: string | null
          id: string | null
          meeting_date: string | null
          meeting_id: string | null
          meeting_title: string | null
          notes: string | null
          promise_text: string | null
          promised_by: string | null
          promised_to: string | null
          reminder_sent: boolean | null
          status: string | null
          urgency: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promises_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_nudge_opportunities: {
        Row: {
          days_since_created: number | null
          due_date: string | null
          priority: string | null
          source: string | null
          task_id: string | null
          title: string | null
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          days_since_created?: never
          due_date?: string | null
          priority?: string | null
          source?: string | null
          task_id?: string | null
          title?: string | null
          urgency?: never
          user_id?: string | null
        }
        Update: {
          days_since_created?: never
          due_date?: string | null
          priority?: string | null
          source?: string | null
          task_id?: string | null
          title?: string | null
          urgency?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_health_summary: {
        Row: {
          contact_name: string | null
          engagement_status: string | null
          last_meeting_date: string | null
          meeting_frequency: string | null
          open_promises_count: number | null
          relationship_health: string | null
          user_id: string | null
        }
        Insert: {
          contact_name?: string | null
          engagement_status?: never
          last_meeting_date?: string | null
          meeting_frequency?: string | null
          open_promises_count?: number | null
          relationship_health?: string | null
          user_id?: string | null
        }
        Update: {
          contact_name?: string | null
          engagement_status?: never
          last_meeting_date?: string | null
          meeting_frequency?: string | null
          open_promises_count?: number | null
          relationship_health?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      upcoming_action_items_view: {
        Row: {
          assigned_contact_id: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          linked_task_id: string | null
          meeting_date: string | null
          meeting_id: string | null
          meeting_title: string | null
          priority: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_usage_summary: {
        Row: {
          email: string | null
          max_tokens_per_day: number | null
          max_tokens_per_month: number | null
          tier: string | null
          tokens_used_this_month: number | null
          tokens_used_today: number | null
          total_cost_all_time: number | null
          total_tokens_all_time: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ai_experience_level: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          industry: string | null
          is_admin: boolean | null
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          onboarding_completed: boolean | null
          organization_id: string | null
          role: string | null
          user_role: string | null
        }
        Insert: {
          ai_experience_level?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          industry?: string | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          role?: string | null
          user_role?: string | null
        }
        Update: {
          ai_experience_level?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          industry?: string | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          onboarding_completed?: boolean | null
          organization_id?: string | null
          role?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_execution_log_entry: {
        Args: { log_entry: Json; task_id: string }
        Returns: undefined
      }
      add_to_queue: {
        Args: {
          p_job_type: string
          p_payload: Json
          p_priority?: number
          p_scheduled_for?: string
          p_source?: string
        }
        Returns: string
      }
      admin_create_organization: {
        Args: { org_name: string; org_slug: string; owner_email: string }
        Returns: string
      }
      admin_get_all_organizations: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_beta_tester: boolean
          member_count: number
          name: string
          slug: string
          subscription_tier: string
        }[]
      }
      admin_get_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          is_super_admin: boolean
          last_sign_in_at: string
        }[]
      }
      admin_set_admin_status: {
        Args: {
          make_admin: boolean
          make_super_admin?: boolean
          target_user_email: string
        }
        Returns: boolean
      }
      auth_user_organization_id: { Args: never; Returns: string }
      block_task_execution: {
        Args: { reason: string; task_id: string }
        Returns: undefined
      }
      bulk_link_emails_to_contacts: {
        Args: { for_user_id: string }
        Returns: number
      }
      calculate_model_cost: {
        Args: {
          p_input_tokens: number
          p_model_id: string
          p_output_tokens: number
        }
        Returns: number
      }
      calculate_relationship_health: {
        Args: { p_contact_id: string; p_user_id: string }
        Returns: string
      }
      can_use_tokens: {
        Args: { p_estimated_tokens: number; p_model: string; p_user_id: string }
        Returns: Json
      }
      check_ai_usage_limits: {
        Args: { p_feature: string; p_user_id: string }
        Returns: {
          allowed: boolean
          reason: string
          requests_limit: number
          requests_used: number
          tokens_limit: number
          tokens_used: number
        }[]
      }
      check_feature_access: {
        Args: { p_feature_slug: string; p_org_id: string }
        Returns: Json
      }
      check_overage_alerts: {
        Args: { p_org_id: string }
        Returns: {
          alert_id: string
          current_percentage: number
          meter_type: string
          should_send: boolean
          threshold_percentage: number
        }[]
      }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      clear_stale_typing: { Args: never; Returns: undefined }
      clear_team_context: { Args: { p_user_id: string }; Returns: undefined }
      complete_automation_job: {
        Args: { p_job_id: string; p_n8n_execution_id?: string; p_result?: Json }
        Returns: boolean
      }
      complete_bot_execution: {
        Args: {
          p_error_message?: string
          p_execution_id: string
          p_output_data?: Json
          p_success: boolean
        }
        Returns: undefined
      }
      complete_n8n_execution: {
        Args: {
          p_error_message?: string
          p_execution_id: string
          p_n8n_execution_id?: string
          p_output_data?: Json
          p_success: boolean
        }
        Returns: undefined
      }
      complete_task_execution: {
        Args: { result_data?: Json; task_id: string }
        Returns: undefined
      }
      copy_document_relationships: {
        Args: { from_doc: string; to_doc: string }
        Returns: undefined
      }
      create_default_knowledge_spaces: {
        Args: { org_id: string; owner_user_id: string }
        Returns: undefined
      }
      create_default_sales_pipeline: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      create_default_teams_for_org: {
        Args: { creator_id: string; org_id: string }
        Returns: undefined
      }
      create_organization: {
        Args: { creator_user_id?: string; org_name: string; org_slug: string }
        Returns: string
      }
      create_organization_and_profile: {
        Args: {
          org_name: string
          user_email: string
          user_full_name: string
          user_id: string
        }
        Returns: string
      }
      create_project_from_decision: {
        Args: {
          p_decision_id: string
          p_project_description?: string
          p_project_name: string
          p_target_date?: string
          p_team_id?: string
        }
        Returns: string
      }
      create_subtask: {
        Args: {
          parent_id: string
          subtask_description: string
          subtask_execution_type?: string
          subtask_priority?: string
          subtask_title: string
        }
        Returns: string
      }
      dispatch_webhook: {
        Args: { p_event_type: string; p_org_id: string; p_payload: Json }
        Returns: {
          delivery_id: string
          webhook_id: string
        }[]
      }
      enroll_lead_in_sequence: {
        Args: {
          p_lead_id: string
          p_lead_type: string
          p_sequence_name: string
        }
        Returns: string
      }
      expire_old_team_invitations: { Args: never; Returns: undefined }
      fail_automation_job: {
        Args: {
          p_error_message: string
          p_job_id: string
          p_permanent?: boolean
        }
        Returns: boolean
      }
      fail_task_execution: {
        Args: { error_message: string; should_retry?: boolean; task_id: string }
        Returns: undefined
      }
      find_matching_contacts_for_project: {
        Args: {
          for_user_id: string
          max_results?: number
          project_id_input: string
        }
        Returns: {
          avatar_url: string
          company: string
          contact_id: string
          full_name: string
          match_reasons: string[]
          relationship_strength: string
          relevance_score: number
        }[]
      }
      get_accessible_documents: {
        Args: {
          limit_count?: number
          org_id_param: string
          scope_filter?: string
          user_id_param: string
        }
        Returns: {
          document_id: string
          is_personal: boolean
          is_shared: boolean
          last_viewed_at: string
          relevance_score: number
          space_names: string[]
          title: string
          view_count: number
          visibility: string
        }[]
      }
      get_api_usage_stats: {
        Args: { p_days?: number; p_org_id: string }
        Returns: {
          avg_response_time_ms: number
          requests_today: number
          success_rate: number
          top_endpoints: Json
          total_cost: number
          total_requests: number
          total_tokens: number
        }[]
      }
      get_bot_stats: {
        Args: { p_org_id: string }
        Returns: {
          active_bots: number
          executions_today: number
          failed_executions: number
          installed_bots: number
          published_bots: number
          successful_executions: number
          total_bots: number
          total_executions: number
          visual_bots: number
        }[]
      }
      get_contacts_needing_followup: {
        Args: { for_user_id: string }
        Returns: {
          company: string
          contact_id: string
          days_since_contact: number
          full_name: string
          last_interaction_at: string
          relationship_strength: string
        }[]
      }
      get_daily_briefing_simple: { Args: { p_user_id: string }; Returns: Json }
      get_decision_tasks: {
        Args: { p_decision_id: string }
        Returns: {
          assigned_to: string
          assigned_to_name: string
          created_at: string
          description: string
          due_date: string
          id: string
          priority: string
          status: string
          title: string
        }[]
      }
      get_ecosystem_totals: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          apps_active: number
          total_active_users: number
          total_donations: number
          total_events: number
          total_revenue: number
        }[]
      }
      get_entity_stats: {
        Args: { p_organization_id: string }
        Returns: {
          count: number
          entity_type: string
          unique_values: number
        }[]
      }
      get_exception_counts: {
        Args: { org_id: string }
        Returns: {
          count: number
          critical_count: number
          status: string
        }[]
      }
      get_executable_tasks: {
        Args: { execution_type_filter?: string; for_organization_id: string }
        Returns: {
          actual_duration_minutes: number | null
          agent_id: string | null
          ai_confidence: number | null
          ai_context: string | null
          assigned_by: string | null
          assigned_to: string | null
          assigned_to_id: string | null
          assigned_to_type: string | null
          automation_rules: Json | null
          blocked_at: string | null
          blocked_reason: string | null
          brand_id: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          decision_id: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          estimated_duration_minutes: number | null
          execution_log: Json | null
          execution_status: string | null
          execution_type: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          max_retries: number | null
          organization_id: string
          parent_task_id: string | null
          priority: string
          project: string | null
          project_id: string | null
          retry_count: number | null
          source: string | null
          source_reference: string | null
          started_at: string | null
          status: string
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          workflow_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_item_stakeholders: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: {
          created_at: string
          id: string
          notes: string
          notify_on_comments: boolean
          notify_on_decision: boolean
          notify_on_updates: boolean
          role: string
          stakeholder_avatar: string
          stakeholder_email: string
          stakeholder_id: string
          stakeholder_name: string
          stakeholder_type: string
        }[]
      }
      get_leads_ready_for_email: {
        Args: never
        Returns: {
          current_step: number
          email_template: string
          enrollment_id: string
          lead_id: string
          lead_type: string
          next_step: number
          sequence_id: string
          subject: string
        }[]
      }
      get_message_read_count: {
        Args: { p_message_id: string }
        Returns: number
      }
      get_my_uplift_user_id: { Args: never; Returns: string }
      get_n8n_stats: {
        Args: { p_org_id: string }
        Returns: {
          active_integrations: number
          active_workflows: number
          avg_execution_time_ms: number
          executions_today: number
          failed_executions: number
          installed_templates: number
          successful_executions: number
          total_executions: number
          total_integrations: number
          total_workflows: number
        }[]
      }
      get_next_automation_job: {
        Args: never
        Returns: {
          attempts: number
          brand_id: string
          entity_id: string
          id: string
          job_type: string
          owner_id: string
          payload: Json
          priority: string
          project_id: string
        }[]
      }
      get_nudge_eligible_users: {
        Args: never
        Returns: {
          nudge_frequency: string
          organization_id: string
          preferred_channel: string
          quiet_hours_end: number
          quiet_hours_start: number
          telegram_chat_id: string
          user_id: string
          whatsapp_number: string
        }[]
      }
      get_onboarding_progress: {
        Args: never
        Returns: {
          completed: boolean
          completed_at: string
          step_key: string
        }[]
      }
      get_or_create_dm_channel: {
        Args: { p_org_id: string; p_other_user_id: string; p_user_id: string }
        Returns: string
      }
      get_or_create_usage_meter: {
        Args: { p_meter_type: string; p_org_id: string }
        Returns: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          current_usage: number | null
          id: string
          included_quota: number | null
          last_synced_to_stripe: string | null
          last_synced_usage: number | null
          meter_type: string
          organization_id: string
          overage_cost: number | null
          overage_price_per_unit: number | null
          overage_units: number | null
          stripe_meter_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "usage_meters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_or_create_user_quota: {
        Args: { p_user_id: string }
        Returns: {
          allowed_models: string[] | null
          can_use_premium_models: boolean | null
          cost_spent_this_month: number | null
          created_at: string | null
          last_reset_date: string | null
          max_cost_per_month: number | null
          max_tokens_per_day: number
          max_tokens_per_month: number
          month_start_date: string | null
          organization_id: string
          tier: string
          tokens_used_this_month: number | null
          tokens_used_today: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_ai_quotas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_organization_features: {
        Args: { p_org_id: string }
        Returns: {
          allowed: boolean
          category: string
          feature_limit: number
          feature_name: string
          feature_slug: string
          source: string
        }[]
      }
      get_pending_action_items: {
        Args: {
          p_limit?: number
          p_organization_id: string
          p_user_id?: string
        }
        Returns: {
          assigned_to: string
          description: string
          document_id: string
          due_date: string
          id: string
          priority: string
          status: string
          title: string
        }[]
      }
      get_pending_ai_jobs: {
        Args: { limit_count?: number }
        Returns: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          max_attempts: number | null
          output_data: Json | null
          priority: number | null
          scheduled_for: string | null
          source_id: string | null
          source_type: string | null
          started_at: string | null
          status: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_processing_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pending_sequence_emails: {
        Args: { batch_size?: number }
        Returns: {
          email_template: string
          lead_email: string
          lead_first_name: string
          send_id: string
          sequence_name: string
          subject: string
        }[]
      }
      get_pending_webhook_deliveries: {
        Args: { p_limit?: number }
        Returns: {
          attempt_count: number
          delivery_id: string
          event_type: string
          headers: Json
          payload: Json
          secret: string
          timeout_seconds: number
          url: string
          webhook_id: string
        }[]
      }
      get_related_items: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: {
          created_at: string
          direction: string
          related_id: string
          related_status: string
          related_title: string
          related_type: string
          relationship_id: string
          relationship_type: string
        }[]
      }
      get_relevant_insights: {
        Args: {
          p_category?: string
          p_limit?: number
          p_organization_id: string
          p_user_id: string
        }
        Returns: {
          confidence_score: number
          description: string
          id: string
          insight_type: string
          relevance_score: number
          title: string
        }[]
      }
      get_system_health_summary: {
        Args: { org_id: string }
        Returns: {
          area: string
          failed_operations: number
          last_failure_at: string
          status: string
          success_rate: number
          total_operations: number
        }[]
      }
      get_task_deliverables_count: {
        Args: { for_task_id: string }
        Returns: number
      }
      get_team_decisions: {
        Args: { p_org_id: string; p_team_id: string }
        Returns: {
          created_at: string
          created_by: string
          creator_name: string
          description: string
          due_date: string
          id: string
          priority: string
          status: string
          title: string
        }[]
      }
      get_typing_users: {
        Args: { p_channel_id: string }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      get_unread_counts: {
        Args: { p_user_id: string }
        Returns: {
          channel_id: string
          unread_count: number
        }[]
      }
      get_unread_notification_count: {
        Args: { usr_id: string }
        Returns: number
      }
      get_upcoming_events: {
        Args: {
          p_days_ahead?: number
          p_limit?: number
          p_organization_id: string
        }
        Returns: {
          description: string
          document_id: string
          event_datetime: string
          event_type: string
          id: string
          priority: string
          status: string
          title: string
        }[]
      }
      get_user_ai_context: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          confidence: number
          content: string
          key: string
          memory_type: string
          reinforcement_count: number
        }[]
      }
      get_user_entities: {
        Args: { p_user_id: string }
        Returns: {
          brand_count: number
          description: string
          entity_type: string
          entity_type_icon: string
          id: string
          name: string
          primary_focus: string
          project_count: number
        }[]
      }
      get_user_preferences: {
        Args: { p_preference_type?: string; p_user_id: string }
        Returns: {
          confidence: number
          preference_key: string
          preference_type: string
          preference_value: Json
        }[]
      }
      get_work_item_stage_counts: {
        Args: { p_team_id: string }
        Returns: {
          count: number
          stage_id: string
        }[]
      }
      get_workflows_for_event: {
        Args: { p_event_data?: Json; p_event_type: string; p_org_id: string }
        Returns: {
          n8n_workflow_id: string
          payload_transform: Json
          webhook_url: string
          workflow_id: string
          workflow_name: string
        }[]
      }
      increment_email_send_count: {
        Args: { config_id: string }
        Returns: undefined
      }
      increment_usage_meter: {
        Args: { p_amount: number; p_meter_type: string; p_org_id: string }
        Returns: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          current_usage: number | null
          id: string
          included_quota: number | null
          last_synced_to_stripe: string | null
          last_synced_usage: number | null
          meter_type: string
          organization_id: string
          overage_cost: number | null
          overage_price_per_unit: number | null
          overage_units: number | null
          stripe_meter_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "usage_meters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      install_marketplace_bot: {
        Args: { p_marketplace_id: string; p_org_id: string; p_user_id: string }
        Returns: string
      }
      invite_to_organization: {
        Args: { invitee_email: string; org_id: string }
        Returns: string
      }
      is_sender_blocked: {
        Args: { p_from_email: string; p_user_id: string }
        Returns: boolean
      }
      load_bot_flow: { Args: { p_agent_id: string }; Returns: Json }
      log_api_usage: {
        Args: {
          p_api_key_id: string
          p_cost_usd?: number
          p_endpoint: string
          p_ip_address?: string
          p_method: string
          p_org_id: string
          p_request_id?: string
          p_response_time_ms: number
          p_status: number
          p_tokens_used?: number
          p_user_agent?: string
        }
        Returns: string
      }
      log_external_event: {
        Args: {
          p_actor_email: string
          p_app_slug: string
          p_entity_id: string
          p_entity_type: string
          p_event_type: string
          p_payload?: Json
        }
        Returns: string
      }
      log_node_execution: {
        Args: {
          p_error?: string
          p_execution_id: string
          p_node_id: string
          p_output?: Json
          p_status: string
        }
        Returns: undefined
      }
      log_team_activity: {
        Args: {
          act_type: string
          meta?: Json
          res_id?: string
          res_title?: string
          res_type?: string
        }
        Returns: undefined
      }
      mark_email_sent: {
        Args: { p_enrollment_id: string; p_next_step: number }
        Returns: undefined
      }
      mark_messages_read: {
        Args: { p_channel_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_onboarding_step_complete: {
        Args: { p_step_key: string }
        Returns: undefined
      }
      mark_webhook_delivery: {
        Args: {
          p_delivery_id: string
          p_error_message?: string
          p_response_body?: string
          p_response_status?: number
          p_response_time_ms?: number
          p_success: boolean
        }
        Returns: undefined
      }
      match_document_chunks: {
        Args: {
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          file_type: string
          filename: string
          id: string
          similarity: number
        }[]
      }
      publish_bot_to_marketplace: {
        Args: {
          p_agent_id: string
          p_category: string
          p_description: string
          p_icon?: string
          p_name: string
          p_price?: number
          p_short_description: string
          p_tags: string[]
        }
        Returns: string
      }
      queue_automation_job: {
        Args: {
          p_brand_id?: string
          p_entity_id?: string
          p_job_type: string
          p_owner_id: string
          p_payload: Json
          p_priority?: string
          p_project_id?: string
          p_scheduled_for?: string
        }
        Returns: string
      }
      record_ai_usage: {
        Args: {
          p_conversation_id?: string
          p_cost: number
          p_input_tokens: number
          p_model: string
          p_output_tokens: number
          p_task_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      record_n8n_execution: {
        Args: {
          p_input_data?: Json
          p_org_id: string
          p_triggered_by: string
          p_triggered_by_user?: string
          p_workflow_id: string
        }
        Returns: string
      }
      reset_daily_email_counts: { Args: never; Returns: undefined }
      save_bot_flow: {
        Args: { p_agent_id: string; p_edges: Json; p_nodes: Json }
        Returns: Json
      }
      search_document_chunks: {
        Args: {
          conversation_id?: string
          match_count?: number
          match_threshold?: number
          org_id: string
          query_embedding: string
          requesting_user_id: string
          search_scope?: string
          space_id?: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          document_title: string
          document_visibility: string
          is_personal: boolean
          is_shared: boolean
          shared_in_conversation: boolean
          similarity: number
          space_name: string
        }[]
      }
      search_documents: {
        Args: {
          filter_organization_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      seed_default_project_stages: {
        Args: { org_id: string; user_id: string }
        Returns: undefined
      }
      set_typing: {
        Args: { p_channel_id: string; p_user_id: string }
        Returns: undefined
      }
      set_user_offline: { Args: { p_user_id: string }; Returns: undefined }
      share_document_with_user: {
        Args: {
          access_level?: string
          doc_id: string
          share_msg?: string
          share_reason_val?: string
          target_user_id: string
        }
        Returns: string
      }
      start_bot_execution: {
        Args: {
          p_agent_id: string
          p_input_data?: Json
          p_org_id: string
          p_triggered_by: string
          p_triggered_by_user?: string
        }
        Returns: string
      }
      start_task_execution: {
        Args: { executor_id: string; executor_type: string; task_id: string }
        Returns: undefined
      }
      switch_team_context: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      sync_external_person: {
        Args: {
          p_app_slug: string
          p_email: string
          p_external_user_id: string
          p_metadata?: Json
          p_name: string
        }
        Returns: string
      }
      sync_n8n_workflow: {
        Args: {
          p_integration_id: string
          p_n8n_workflow_id: string
          p_n8n_workflow_name: string
          p_org_id: string
          p_trigger_config?: Json
          p_trigger_type?: string
        }
        Returns: string
      }
      track_conversion_event: {
        Args: {
          p_event_type: string
          p_ip_address?: string
          p_metadata?: Json
          p_organization_id?: string
          p_page_url?: string
          p_referrer?: string
          p_user_agent?: string
          p_user_id?: string
          p_utm_campaign?: string
          p_utm_content?: string
          p_utm_medium?: string
          p_utm_source?: string
          p_utm_term?: string
        }
        Returns: string
      }
      track_document_usage: {
        Args: {
          doc_id: string
          entity_id: string
          entity_type: string
          usage_ctx?: string
        }
        Returns: undefined
      }
      track_documents_used_together: {
        Args: { context_type?: string; doc_a: string; doc_b: string }
        Returns: undefined
      }
      update_user_online_status: {
        Args: { online: boolean; user_uuid: string }
        Returns: undefined
      }
      update_user_presence: {
        Args: {
          p_status?: string
          p_status_message?: string
          p_user_id: string
        }
        Returns: undefined
      }
      upsert_ai_memory: {
        Args: {
          p_confidence?: number
          p_content: string
          p_key?: string
          p_memory_type: string
          p_source?: string
          p_source_id?: string
          p_user_id: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: { perm_name: string; resource_uuid?: string; user_uuid: string }
        Returns: boolean
      }
      validate_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          api_key_id: string
          error_message: string
          is_valid: boolean
          organization_id: string
          rate_limit_per_minute: number
          scopes: string[]
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
