export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assistant_conversations: {
        Row: {
          id: string
          assistant_id: string
          organization_id: string
          user_id: string
          title: string
          status: string
          context_data: unknown
          created_at: string
          updated_at: string
          last_message_at: string
        }
        Insert: {
          id: string
          assistant_id: string
          organization_id: string
          user_id: string
          title?: string
          status?: string
          context_data?: unknown
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          assistant_id?: string
          organization_id?: string
          user_id?: string
          title?: string
          status?: string
          context_data?: unknown
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Relationships: []
      }
      user_ai_quotas: {
        Row: {
          user_id: string
          organization_id: string
          tier: string
          max_tokens_per_day: number
          tokens_used_today: number
          last_reset_date: string
          max_tokens_per_month: number
          tokens_used_this_month: number
          month_start_date: string
          can_use_premium_models: boolean
          allowed_models: string[]
          max_cost_per_month: number
          cost_spent_this_month: number
          updated_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          organization_id: string
          tier: string
          max_tokens_per_day: number
          tokens_used_today?: number
          last_reset_date?: string
          max_tokens_per_month: number
          tokens_used_this_month?: number
          month_start_date?: string
          can_use_premium_models?: boolean
          allowed_models?: string[]
          max_cost_per_month?: number
          cost_spent_this_month?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          organization_id?: string
          tier?: string
          max_tokens_per_day?: number
          tokens_used_today?: number
          last_reset_date?: string
          max_tokens_per_month?: number
          tokens_used_this_month?: number
          month_start_date?: string
          can_use_premium_models?: boolean
          allowed_models?: string[]
          max_cost_per_month?: number
          cost_spent_this_month?: number
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      user_ai_usage_summary: {
        Row: {
          user_id: string
          email: string
          tier: string
          total_tokens_all_time: number
          total_cost_all_time: number
          tokens_used_today: number
          tokens_used_this_month: number
          max_tokens_per_day: number
          max_tokens_per_month: number
        }
        Insert: {
          user_id?: string
          email?: string
          tier?: string
          total_tokens_all_time?: number
          total_cost_all_time?: number
          tokens_used_today?: number
          tokens_used_this_month?: number
          max_tokens_per_day?: number
          max_tokens_per_month?: number
        }
        Update: {
          user_id?: string
          email?: string
          tier?: string
          total_tokens_all_time?: number
          total_cost_all_time?: number
          tokens_used_today?: number
          tokens_used_this_month?: number
          max_tokens_per_day?: number
          max_tokens_per_month?: number
        }
        Relationships: []
      }
      lead_email_sequence_state: {
        Row: {
          id: string
          lead_type: string
          lead_id: string
          sequence_id: string
          current_step: number
          next_send_date: string
          status: string
          enrolled_at: string
          last_sent_at: string
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          lead_type: string
          lead_id: string
          sequence_id: string
          current_step?: number
          next_send_date?: string
          status?: string
          enrolled_at?: string
          last_sent_at?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_type?: string
          lead_id?: string
          sequence_id?: string
          current_step?: number
          next_send_date?: string
          status?: string
          enrolled_at?: string
          last_sent_at?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          added_by: string
          added_at: string
        }
        Insert: {
          id: string
          group_id: string
          user_id: string
          role?: string
          added_by?: string
          added_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          added_by?: string
          added_at?: string
        }
        Relationships: []
      }
      document_access: {
        Row: {
          id: string
          document_id: string
          user_id: string
          team_id: string
          role_name: string
          access_level: string
          can_reshare: boolean
          granted_by: string
          granted_at: string
          expires_at: string
          share_message: string
          share_reason: string
          shared_in_conversation_id: string
          require_acknowledgment: boolean
          acknowledged_at: string
          viewed_at: string
          view_count: number
        }
        Insert: {
          id: string
          document_id: string
          user_id?: string
          team_id?: string
          role_name?: string
          access_level: string
          can_reshare?: boolean
          granted_by: string
          granted_at?: string
          expires_at?: string
          share_message?: string
          share_reason?: string
          shared_in_conversation_id?: string
          require_acknowledgment?: boolean
          acknowledged_at?: string
          viewed_at?: string
          view_count?: number
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          team_id?: string
          role_name?: string
          access_level?: string
          can_reshare?: boolean
          granted_by?: string
          granted_at?: string
          expires_at?: string
          share_message?: string
          share_reason?: string
          shared_in_conversation_id?: string
          require_acknowledgment?: boolean
          acknowledged_at?: string
          viewed_at?: string
          view_count?: number
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          provider: string
          provider_account_id: string
          email_address: string
          access_token: string
          refresh_token: string
          token_expires_at: string
          sync_enabled: boolean
          last_sync_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          organization_id: string
          provider: string
          provider_account_id: string
          email_address: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          sync_enabled?: boolean
          last_sync_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          provider?: string
          provider_account_id?: string
          email_address?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          sync_enabled?: boolean
          last_sync_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description: string
          color: string
          icon: string
          parent_folder_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id?: string
          name: string
          description?: string
          color?: string
          icon?: string
          parent_folder_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          name?: string
          description?: string
          color?: string
          icon?: string
          parent_folder_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_schedules: {
        Row: {
          id: string
          workflow_id: string
          organization_id: string
          cron_expression: string
          timezone: string
          enabled: boolean
          last_run_at: string
          next_run_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          workflow_id: string
          organization_id: string
          cron_expression: string
          timezone?: string
          enabled?: boolean
          last_run_at?: string
          next_run_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          organization_id?: string
          cron_expression?: string
          timezone?: string
          enabled?: boolean
          last_run_at?: string
          next_run_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assistant_role_templates: {
        Row: {
          id: string
          name: string
          description: string
          role: string
          avatar_emoji: string
          category: string
          default_instructions: string
          default_personality: unknown
          default_tone: string
          default_verbosity: string
          default_capabilities: unknown
          use_cases: unknown
          example_prompts: unknown
          is_popular: boolean
          usage_count: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string
          role: string
          avatar_emoji?: string
          category?: string
          default_instructions: string
          default_personality?: unknown
          default_tone?: string
          default_verbosity?: string
          default_capabilities?: unknown
          use_cases?: unknown
          example_prompts?: unknown
          is_popular?: boolean
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          role?: string
          avatar_emoji?: string
          category?: string
          default_instructions?: string
          default_personality?: unknown
          default_tone?: string
          default_verbosity?: string
          default_capabilities?: unknown
          use_cases?: unknown
          example_prompts?: unknown
          is_popular?: boolean
          usage_count?: number
          created_at?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          id: string
          event_type: string
          user_id: string
          organization_id: string
          metadata: unknown
          utm_source: string
          utm_medium: string
          utm_campaign: string
          utm_term: string
          utm_content: string
          referrer: string
          page_url: string
          user_agent: string
          ip_address: string
          created_at: string
        }
        Insert: {
          id: string
          event_type: string
          user_id?: string
          organization_id?: string
          metadata?: unknown
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          referrer?: string
          page_url?: string
          user_agent?: string
          ip_address?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string
          organization_id?: string
          metadata?: unknown
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          referrer?: string
          page_url?: string
          user_agent?: string
          ip_address?: string
          created_at?: string
        }
        Relationships: []
      }
      predictive_suggestions: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          suggestion_type: string
          title: string
          description: string
          suggested_action: unknown
          relevance_score: number
          confidence: number
          priority: string
          based_on_insights: string[]
          based_on_patterns: string[]
          based_on_preferences: string[]
          context_tags: string[]
          applicable_scenarios: unknown
          status: string
          shown_at: string
          accepted_at: string
          dismissed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          suggestion_type: string
          title: string
          description: string
          suggested_action?: unknown
          relevance_score?: number
          confidence?: number
          priority?: string
          based_on_insights?: string[]
          based_on_patterns?: string[]
          based_on_preferences?: string[]
          context_tags?: string[]
          applicable_scenarios?: unknown
          status?: string
          shown_at?: string
          accepted_at?: string
          dismissed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          suggestion_type?: string
          title?: string
          description?: string
          suggested_action?: unknown
          relevance_score?: number
          confidence?: number
          priority?: string
          based_on_insights?: string[]
          based_on_patterns?: string[]
          based_on_preferences?: string[]
          context_tags?: string[]
          applicable_scenarios?: unknown
          status?: string
          shown_at?: string
          accepted_at?: string
          dismissed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_events: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          event_type: string
          event_source: string
          source_id: string
          event_data: unknown
          insights_generated: string[]
          patterns_updated: string[]
          preferences_updated: string[]
          processed: boolean
          processed_at: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id?: string
          event_type: string
          event_source: string
          source_id?: string
          event_data: unknown
          insights_generated?: string[]
          patterns_updated?: string[]
          preferences_updated?: string[]
          processed?: boolean
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          event_type?: string
          event_source?: string
          source_id?: string
          event_data?: unknown
          insights_generated?: string[]
          patterns_updated?: string[]
          preferences_updated?: string[]
          processed?: boolean
          processed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      document_knowledge_spaces: {
        Row: {
          id: string
          document_id: string
          knowledge_space_id: string
          added_by: string
          added_at: string
          is_pinned: boolean
        }
        Insert: {
          id: string
          document_id: string
          knowledge_space_id: string
          added_by?: string
          added_at?: string
          is_pinned?: boolean
        }
        Update: {
          id?: string
          document_id?: string
          knowledge_space_id?: string
          added_by?: string
          added_at?: string
          is_pinned?: boolean
        }
        Relationships: []
      }
      knowledge_graph: {
        Row: {
          id: string
          organization_id: string
          source_concept: string
          target_concept: string
          relationship_type: string
          strength: number
          confidence: number
          evidence_count: number
          evidence_sources: unknown
          context_tags: string[]
          domain: string
          is_active: boolean
          last_seen_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          source_concept: string
          target_concept: string
          relationship_type: string
          strength?: number
          confidence?: number
          evidence_count?: number
          evidence_sources?: unknown
          context_tags?: string[]
          domain?: string
          is_active?: boolean
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          source_concept?: string
          target_concept?: string
          relationship_type?: string
          strength?: number
          confidence?: number
          evidence_count?: number
          evidence_sources?: unknown
          context_tags?: string[]
          domain?: string
          is_active?: boolean
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          id: string
          agent_id: string
          action_type: string
          action_data: unknown
          status: string
          error_message: string
          task_id: string
          created_at: string
        }
        Insert: {
          id: string
          agent_id: string
          action_type: string
          action_data?: unknown
          status: string
          error_message?: string
          task_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          action_type?: string
          action_data?: unknown
          status?: string
          error_message?: string
          task_id?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description: string
          agent_type: string
          config: unknown
          personality: string
          instructions: string
          enabled: boolean
          total_actions: number
          successful_actions: number
          failed_actions: number
          last_active_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description?: string
          agent_type: string
          config?: unknown
          personality?: string
          instructions?: string
          enabled?: boolean
          total_actions?: number
          successful_actions?: number
          failed_actions?: number
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          name?: string
          description?: string
          agent_type?: string
          config?: unknown
          personality?: string
          instructions?: string
          enabled?: boolean
          total_actions?: number
          successful_actions?: number
          failed_actions?: number
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_sequence_sends: {
        Row: {
          id: string
          lead_id: string
          sequence_id: string
          step_id: string
          sent_at: string
          scheduled_for: string
          status: string
          resend_email_id: string
          error_message: string
          opened_at: string
          clicked_at: string
          created_at: string
        }
        Insert: {
          id: string
          lead_id?: string
          sequence_id?: string
          step_id?: string
          sent_at?: string
          scheduled_for?: string
          status?: string
          resend_email_id?: string
          error_message?: string
          opened_at?: string
          clicked_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          sequence_id?: string
          step_id?: string
          sent_at?: string
          scheduled_for?: string
          status?: string
          resend_email_id?: string
          error_message?: string
          opened_at?: string
          clicked_at?: string
          created_at?: string
        }
        Relationships: []
      }
      user_ai_usage: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          date: string
          model: string
          input_tokens: number
          output_tokens: number
          total_tokens: number
          total_cost: number
          conversation_id: string
          task_type: string
          was_auto_selected: boolean
          selected_by_routing: boolean
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          organization_id: string
          date: string
          model: string
          input_tokens: number
          output_tokens: number
          total_tokens?: number
          total_cost: number
          conversation_id?: string
          task_type?: string
          was_auto_selected?: boolean
          selected_by_routing?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          date?: string
          model?: string
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          total_cost?: number
          conversation_id?: string
          task_type?: string
          was_auto_selected?: boolean
          selected_by_routing?: boolean
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan: string
          status: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: string
          can_send_messages: boolean
          can_invite_others: boolean
          can_edit_conversation: boolean
          joined_at: string
          last_read_at: string
          notification_enabled: boolean
          metadata: unknown
        }
        Insert: {
          id: string
          conversation_id: string
          user_id: string
          role: string
          can_send_messages?: boolean
          can_invite_others?: boolean
          can_edit_conversation?: boolean
          joined_at: string
          last_read_at?: string
          notification_enabled?: boolean
          metadata?: unknown
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: string
          can_send_messages?: boolean
          can_invite_others?: boolean
          can_edit_conversation?: boolean
          joined_at?: string
          last_read_at?: string
          notification_enabled?: boolean
          metadata?: unknown
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          category: string
          nodes: unknown
          edges: unknown
          default_trigger_type: string
          example_input: unknown
          example_output: unknown
          use_cases: unknown
          is_popular: boolean
          usage_count: number
          estimated_duration: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string
          icon?: string
          category?: string
          nodes: unknown
          edges: unknown
          default_trigger_type?: string
          example_input?: unknown
          example_output?: unknown
          use_cases?: unknown
          is_popular?: boolean
          usage_count?: number
          estimated_duration?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: string
          nodes?: unknown
          edges?: unknown
          default_trigger_type?: string
          example_input?: unknown
          example_output?: unknown
          use_cases?: unknown
          is_popular?: boolean
          usage_count?: number
          estimated_duration?: string
          created_at?: string
        }
        Relationships: []
      }
      document_context_usage: {
        Row: {
          id: string
          document_id: string
          used_in_entity_type: string
          used_in_entity_id: string
          used_by_user_id: string
          usage_count: number
          first_used_at: string
          last_used_at: string
          usage_context: string
        }
        Insert: {
          id: string
          document_id: string
          used_in_entity_type: string
          used_in_entity_id: string
          used_by_user_id: string
          usage_count?: number
          first_used_at?: string
          last_used_at?: string
          usage_context?: string
        }
        Update: {
          id?: string
          document_id?: string
          used_in_entity_type?: string
          used_in_entity_id?: string
          used_by_user_id?: string
          usage_count?: number
          first_used_at?: string
          last_used_at?: string
          usage_context?: string
        }
        Relationships: []
      }
      mentions: {
        Row: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          mentioned_user_id: string
          mentioned_by_user_id: string
          content_snippet: string
          is_read: boolean
          read_at: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          mentioned_user_id: string
          mentioned_by_user_id: string
          content_snippet?: string
          is_read?: boolean
          read_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          mentioned_user_id?: string
          mentioned_by_user_id?: string
          content_snippet?: string
          is_read?: boolean
          read_at?: string
          created_at?: string
        }
        Relationships: []
      }
      conversation_bookmarks: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          note: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          conversation_id: string
          note?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          note?: string
          created_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id: string
          role: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          permission_id?: string
          created_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          company: string
          phone: string
          source: string
          lead_magnet: string
          status: string
          tags: string[]
          metadata: unknown
          created_at: string
          updated_at: string
          segment: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          company?: string
          phone?: string
          source?: string
          lead_magnet?: string
          status?: string
          tags?: string[]
          metadata?: unknown
          created_at?: string
          updated_at?: string
          segment?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          company?: string
          phone?: string
          source?: string
          lead_magnet?: string
          status?: string
          tags?: string[]
          metadata?: unknown
          created_at?: string
          updated_at?: string
          segment?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          preference_type: string
          preference_key: string
          preference_value: unknown
          confidence: number
          evidence_count: number
          sources: unknown
          context_tags: string[]
          is_explicit: boolean
          is_active: boolean
          last_used_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          organization_id: string
          preference_type: string
          preference_key: string
          preference_value: unknown
          confidence?: number
          evidence_count?: number
          sources?: unknown
          context_tags?: string[]
          is_explicit?: boolean
          is_active?: boolean
          last_used_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          preference_type?: string
          preference_key?: string
          preference_value?: unknown
          confidence?: number
          evidence_count?: number
          sources?: unknown
          context_tags?: string[]
          is_explicit?: boolean
          is_active?: boolean
          last_used_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_conversations: {
        Row: {
          id: string
          organization_id: string
          created_by: string
          title: string
          description: string
          document_id: string
          context_type: string
          is_private: boolean
          is_archived: boolean
          tags: string[]
          metadata: unknown
          created_at: string
          updated_at: string
          last_message_at: string
          knowledge_space_id: string
          attached_document_ids: string[]
          rag_accessible_document_ids: string[]
          rag_scope: string
        }
        Insert: {
          id: string
          organization_id: string
          created_by: string
          title: string
          description?: string
          document_id?: string
          context_type?: string
          is_private?: boolean
          is_archived?: boolean
          tags?: string[]
          metadata?: unknown
          created_at: string
          updated_at: string
          last_message_at?: string
          knowledge_space_id?: string
          attached_document_ids?: string[]
          rag_accessible_document_ids?: string[]
          rag_scope?: string
        }
        Update: {
          id?: string
          organization_id?: string
          created_by?: string
          title?: string
          description?: string
          document_id?: string
          context_type?: string
          is_private?: boolean
          is_archived?: boolean
          tags?: string[]
          metadata?: unknown
          created_at?: string
          updated_at?: string
          last_message_at?: string
          knowledge_space_id?: string
          attached_document_ids?: string[]
          rag_accessible_document_ids?: string[]
          rag_scope?: string
        }
        Relationships: []
      }
      document_projects: {
        Row: {
          id: string
          document_id: string
          project_id: string
          added_by: string
          added_at: string
        }
        Insert: {
          id: string
          document_id: string
          project_id: string
          added_by?: string
          added_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          project_id?: string
          added_by?: string
          added_at?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          insight_type: string
          category: string
          title: string
          description: string
          key_findings: unknown
          evidence: unknown
          confidence_score: number
          relevance_score: number
          frequency_count: number
          context_tags: string[]
          related_insights: string[]
          related_conversations: string[]
          related_documents: string[]
          status: string
          verified_at: string
          verified_by: string
          metadata: unknown
          created_at: string
          updated_at: string
          last_seen_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id?: string
          insight_type: string
          category?: string
          title: string
          description: string
          key_findings?: unknown
          evidence?: unknown
          confidence_score?: number
          relevance_score?: number
          frequency_count?: number
          context_tags?: string[]
          related_insights?: string[]
          related_conversations?: string[]
          related_documents?: string[]
          status?: string
          verified_at?: string
          verified_by?: string
          metadata?: unknown
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          insight_type?: string
          category?: string
          title?: string
          description?: string
          key_findings?: unknown
          evidence?: unknown
          confidence_score?: number
          relevance_score?: number
          frequency_count?: number
          context_tags?: string[]
          related_insights?: string[]
          related_conversations?: string[]
          related_documents?: string[]
          status?: string
          verified_at?: string
          verified_by?: string
          metadata?: unknown
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          id: string
          code_id: string
          user_id: string
          redeemed_at: string
        }
        Insert: {
          id: string
          code_id: string
          user_id: string
          redeemed_at?: string
        }
        Update: {
          id?: string
          code_id?: string
          user_id?: string
          redeemed_at?: string
        }
        Relationships: []
      }
      document_relationships: {
        Row: {
          id: string
          source_document_id: string
          related_document_id: string
          relationship_type: string
          strength: number
          created_by_type: string
          created_by_user_id: string
          found_in_conversation_id: string
          ai_confidence: number
          created_at: string
        }
        Insert: {
          id: string
          source_document_id: string
          related_document_id: string
          relationship_type: string
          strength?: number
          created_by_type: string
          created_by_user_id?: string
          found_in_conversation_id?: string
          ai_confidence?: number
          created_at?: string
        }
        Update: {
          id?: string
          source_document_id?: string
          related_document_id?: string
          relationship_type?: string
          strength?: number
          created_by_type?: string
          created_by_user_id?: string
          found_in_conversation_id?: string
          ai_confidence?: number
          created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          title: string
          description: string
          status: string
          priority: string
          due_date: string
          conversation_id: string
          created_at: string
          updated_at: string
          execution_type: string
          assigned_to_type: string
          assigned_to_id: string
          assigned_by: string
          execution_status: string
          workflow_id: string
          agent_id: string
          execution_log: unknown
          automation_rules: unknown
          ai_confidence: number
          ai_context: string
          parent_task_id: string
          started_at: string
          blocked_at: string
          blocked_reason: string
          failed_at: string
          failure_reason: string
          retry_count: number
          max_retries: number
          estimated_duration_minutes: number
          actual_duration_minutes: number
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          title: string
          description?: string
          status: string
          priority: string
          due_date?: string
          conversation_id?: string
          created_at?: string
          updated_at?: string
          execution_type?: string
          assigned_to_type?: string
          assigned_to_id?: string
          assigned_by?: string
          execution_status?: string
          workflow_id?: string
          agent_id?: string
          execution_log?: unknown
          automation_rules?: unknown
          ai_confidence?: number
          ai_context?: string
          parent_task_id?: string
          started_at?: string
          blocked_at?: string
          blocked_reason?: string
          failed_at?: string
          failure_reason?: string
          retry_count?: number
          max_retries?: number
          estimated_duration_minutes?: number
          actual_duration_minutes?: number
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          title?: string
          description?: string
          status?: string
          priority?: string
          due_date?: string
          conversation_id?: string
          created_at?: string
          updated_at?: string
          execution_type?: string
          assigned_to_type?: string
          assigned_to_id?: string
          assigned_by?: string
          execution_status?: string
          workflow_id?: string
          agent_id?: string
          execution_log?: unknown
          automation_rules?: unknown
          ai_confidence?: number
          ai_context?: string
          parent_task_id?: string
          started_at?: string
          blocked_at?: string
          blocked_reason?: string
          failed_at?: string
          failure_reason?: string
          retry_count?: number
          max_retries?: number
          estimated_duration_minutes?: number
          actual_duration_minutes?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string
          organization_id: string
          created_at: string
          updated_at: string
          role: string
          beta_tester: boolean
          beta_tier: string
          onboarding_completed: boolean
          onboarding_step: number
          onboarding_skipped: boolean
          user_role: string
          industry: string
          primary_goal: string
          team_context: string
          content_types: string[]
          ai_experience_level: string
          preferred_name: string
          timezone: string
          use_case_tags: string[]
          primary_goals: string[]
          bio: string
          expertise: string[]
          department: string
          job_title: string
          is_online: boolean
          preferences: unknown
          onboarding_completed_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          avatar_url?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
          role?: string
          beta_tester?: boolean
          beta_tier?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          onboarding_skipped?: boolean
          user_role?: string
          industry?: string
          primary_goal?: string
          team_context?: string
          content_types?: string[]
          ai_experience_level?: string
          preferred_name?: string
          timezone?: string
          use_case_tags?: string[]
          primary_goals?: string[]
          bio?: string
          expertise?: string[]
          department?: string
          job_title?: string
          is_online?: boolean
          preferences?: unknown
          onboarding_completed_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
          role?: string
          beta_tester?: boolean
          beta_tier?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          onboarding_skipped?: boolean
          user_role?: string
          industry?: string
          primary_goal?: string
          team_context?: string
          content_types?: string[]
          ai_experience_level?: string
          preferred_name?: string
          timezone?: string
          use_case_tags?: string[]
          primary_goals?: string[]
          bio?: string
          expertise?: string[]
          department?: string
          job_title?: string
          is_online?: boolean
          preferences?: unknown
          onboarding_completed_at?: string
        }
        Relationships: []
      }
      team_activity: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          activity_type: string
          resource_type: string
          resource_id: string
          resource_title: string
          metadata: unknown
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          activity_type: string
          resource_type?: string
          resource_id?: string
          resource_title?: string
          metadata?: unknown
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          activity_type?: string
          resource_type?: string
          resource_id?: string
          resource_title?: string
          metadata?: unknown
          created_at?: string
        }
        Relationships: []
      }
      document_usage_patterns: {
        Row: {
          id: string
          user_id: string
          document_a_id: string
          document_b_id: string
          used_together_in: string
          times_used_together: number
          last_used_together_at: string
        }
        Insert: {
          id: string
          user_id: string
          document_a_id: string
          document_b_id: string
          used_together_in: string
          times_used_together?: number
          last_used_together_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_a_id?: string
          document_b_id?: string
          used_together_in?: string
          times_used_together?: number
          last_used_together_at?: string
        }
        Relationships: []
      }
      workflow_execution_logs: {
        Row: {
          id: string
          execution_id: string
          node_id: string
          node_type: string
          status: string
          input_data: unknown
          output_data: unknown
          error_message: string
          started_at: string
          completed_at: string
          duration_ms: number
          created_at: string
        }
        Insert: {
          id: string
          execution_id: string
          node_id: string
          node_type: string
          status: string
          input_data?: unknown
          output_data?: unknown
          error_message?: string
          started_at?: string
          completed_at?: string
          duration_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          node_id?: string
          node_type?: string
          status?: string
          input_data?: unknown
          output_data?: unknown
          error_message?: string
          started_at?: string
          completed_at?: string
          duration_ms?: number
          created_at?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: string
          content: string
          model_used: string
          tokens_used: number
          cost_usd: number
          is_edited: boolean
          edited_at: string
          is_deleted: boolean
          reactions: unknown
          reply_to_message_id: string
          metadata: unknown
          created_at: string
        }
        Insert: {
          id: string
          conversation_id: string
          user_id?: string
          role: string
          content: string
          model_used?: string
          tokens_used?: number
          cost_usd?: number
          is_edited?: boolean
          edited_at?: string
          is_deleted?: boolean
          reactions?: unknown
          reply_to_message_id?: string
          metadata?: unknown
          created_at: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: string
          content?: string
          model_used?: string
          tokens_used?: number
          cost_usd?: number
          is_edited?: boolean
          edited_at?: string
          is_deleted?: boolean
          reactions?: unknown
          reply_to_message_id?: string
          metadata?: unknown
          created_at?: string
        }
        Relationships: []
      }
      accessible_documents: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          title: string
          content: string
          file_url: string
          file_type: string
          embedding: string
          created_at: string
          updated_at: string
          file_size: number
          status: string
          error_message: string
          metadata: unknown
          folder_id: string
          summary: string
          key_points: unknown
          document_type: string
          summary_generated_at: string
          summary_tokens_used: number
          summary_cost_usd: number
          access_type: string
          shared_by: string
          can_edit_shared: boolean
          shared_by_name: string
        }
        Insert: {
          id?: string
          organization_id?: string
          user_id?: string
          title?: string
          content?: string
          file_url?: string
          file_type?: string
          embedding?: string
          created_at?: string
          updated_at?: string
          file_size?: number
          status?: string
          error_message?: string
          metadata?: unknown
          folder_id?: string
          summary?: string
          key_points?: unknown
          document_type?: string
          summary_generated_at?: string
          summary_tokens_used?: number
          summary_cost_usd?: number
          access_type?: string
          shared_by?: string
          can_edit_shared?: boolean
          shared_by_name?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          title?: string
          content?: string
          file_url?: string
          file_type?: string
          embedding?: string
          created_at?: string
          updated_at?: string
          file_size?: number
          status?: string
          error_message?: string
          metadata?: unknown
          folder_id?: string
          summary?: string
          key_points?: unknown
          document_type?: string
          summary_generated_at?: string
          summary_tokens_used?: number
          summary_cost_usd?: number
          access_type?: string
          shared_by?: string
          can_edit_shared?: boolean
          shared_by_name?: string
        }
        Relationships: []
      }
      document_access_log: {
        Row: {
          user_id: string
          document_id: string
          access_type: string
          conversation_id: string
          accessed_at: string
        }
        Insert: {
          user_id?: string
          document_id?: string
          access_type?: string
          conversation_id?: string
          accessed_at?: string
        }
        Update: {
          user_id?: string
          document_id?: string
          access_type?: string
          conversation_id?: string
          accessed_at?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          organization_id: string
          user_id: string
          status: string
          input_data: unknown
          output_data: unknown
          current_node_id: string
          node_results: unknown
          error_message: string
          error_node_id: string
          started_at: string
          completed_at: string
          duration_ms: number
          created_at: string
          triggered_by: string
        }
        Insert: {
          id: string
          workflow_id: string
          organization_id: string
          user_id: string
          status: string
          input_data?: unknown
          output_data?: unknown
          current_node_id?: string
          node_results?: unknown
          error_message?: string
          error_node_id?: string
          started_at?: string
          completed_at?: string
          duration_ms?: number
          created_at?: string
          triggered_by: string
        }
        Update: {
          id?: string
          workflow_id?: string
          organization_id?: string
          user_id?: string
          status?: string
          input_data?: unknown
          output_data?: unknown
          current_node_id?: string
          node_results?: unknown
          error_message?: string
          error_node_id?: string
          started_at?: string
          completed_at?: string
          duration_ms?: number
          created_at?: string
          triggered_by?: string
        }
        Relationships: []
      }
      enterprise_demo_requests: {
        Row: {
          id: string
          email: string
          full_name: string
          company_name: string
          job_title: string
          phone: string
          company_size: string
          industry: string
          use_case: string
          estimated_users: number
          required_features: unknown
          compliance_requirements: unknown
          utm_source: string
          utm_medium: string
          utm_campaign: string
          referrer: string
          status: string
          contacted_at: string
          demo_scheduled_at: string
          demo_completed_at: string
          deal_value: number
          notes: string
          admin_notes: string
          user_id: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          company_name: string
          job_title?: string
          phone?: string
          company_size?: string
          industry?: string
          use_case?: string
          estimated_users?: number
          required_features?: unknown
          compliance_requirements?: unknown
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          referrer?: string
          status?: string
          contacted_at?: string
          demo_scheduled_at?: string
          demo_completed_at?: string
          deal_value?: number
          notes?: string
          admin_notes?: string
          user_id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          company_name?: string
          job_title?: string
          phone?: string
          company_size?: string
          industry?: string
          use_case?: string
          estimated_users?: number
          required_features?: unknown
          compliance_requirements?: unknown
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          referrer?: string
          status?: string
          contacted_at?: string
          demo_scheduled_at?: string
          demo_completed_at?: string
          deal_value?: number
          notes?: string
          admin_notes?: string
          user_id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      beta_invite_codes: {
        Row: {
          id: string
          code: string
          max_uses: number
          uses_count: number
          beta_tier: string
          expires_at: string
          created_by: string
          created_at: string
          updated_at: string
          invited_email: string
          notes: string
        }
        Insert: {
          id: string
          code: string
          max_uses?: number
          uses_count?: number
          beta_tier: string
          expires_at?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          invited_email?: string
          notes?: string
        }
        Update: {
          id?: string
          code?: string
          max_uses?: number
          uses_count?: number
          beta_tier?: string
          expires_at?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          invited_email?: string
          notes?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          feature: string
          tokens_used: number
          cost: number
          metadata: unknown
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          feature: string
          tokens_used?: number
          cost?: number
          metadata?: unknown
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          feature?: string
          tokens_used?: number
          cost?: number
          metadata?: unknown
          created_at?: string
        }
        Relationships: []
      }
      daily_ai_usage_summary: {
        Row: {
          date: string
          model: string
          unique_users: number
          total_input_tokens: number
          total_output_tokens: number
          total_tokens: number
          total_cost: number
        }
        Insert: {
          date?: string
          model?: string
          unique_users?: number
          total_input_tokens?: number
          total_output_tokens?: number
          total_tokens?: number
          total_cost?: number
        }
        Update: {
          date?: string
          model?: string
          unique_users?: number
          total_input_tokens?: number
          total_output_tokens?: number
          total_tokens?: number
          total_cost?: number
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          name: string
          resource_type: string
          action: string
          description: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          resource_type: string
          action: string
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          resource_type?: string
          action?: string
          description?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_assistants: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description: string
          role: string
          avatar_emoji: string
          personality_traits: unknown
          tone: string
          verbosity: string
          system_instructions: string
          context_knowledge: string
          example_interactions: unknown
          capabilities: unknown
          tools_enabled: unknown
          model_preference: string
          temperature: number
          max_tokens: number
          enabled: boolean
          is_public: boolean
          is_featured: boolean
          total_conversations: number
          total_messages: number
          last_used_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description?: string
          role: string
          avatar_emoji?: string
          personality_traits?: unknown
          tone?: string
          verbosity?: string
          system_instructions: string
          context_knowledge?: string
          example_interactions?: unknown
          capabilities?: unknown
          tools_enabled?: unknown
          model_preference?: string
          temperature?: number
          max_tokens?: number
          enabled?: boolean
          is_public?: boolean
          is_featured?: boolean
          total_conversations?: number
          total_messages?: number
          last_used_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          name?: string
          description?: string
          role?: string
          avatar_emoji?: string
          personality_traits?: unknown
          tone?: string
          verbosity?: string
          system_instructions?: string
          context_knowledge?: string
          example_interactions?: unknown
          capabilities?: unknown
          tools_enabled?: unknown
          model_preference?: string
          temperature?: number
          max_tokens?: number
          enabled?: boolean
          is_public?: boolean
          is_featured?: boolean
          total_conversations?: number
          total_messages?: number
          last_used_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          id: string
          conversation_id: string
          organization_id: string
          role: string
          content: string
          metadata: unknown
          attachments: unknown
          rating: number
          feedback: string
          created_at: string
        }
        Insert: {
          id: string
          conversation_id: string
          organization_id: string
          role: string
          content: string
          metadata?: unknown
          attachments?: unknown
          rating?: number
          feedback?: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          organization_id?: string
          role?: string
          content?: string
          metadata?: unknown
          attachments?: unknown
          rating?: number
          feedback?: string
          created_at?: string
        }
        Relationships: []
      }
      knowledge_contributions: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          contribution_type: string
          resource_id: string
          resource_title: string
          views_count: number
          shares_count: number
          helpful_votes: number
          tags: string[]
          metadata: unknown
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          organization_id: string
          contribution_type: string
          resource_id: string
          resource_title?: string
          views_count?: number
          shares_count?: number
          helpful_votes?: number
          tags?: string[]
          metadata?: unknown
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          contribution_type?: string
          resource_id?: string
          resource_title?: string
          views_count?: number
          shares_count?: number
          helpful_votes?: number
          tags?: string[]
          metadata?: unknown
          created_at?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          id: string
          name: string
          description: string
          sequence_type: string
          is_active: boolean
          trigger_event: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string
          sequence_type: string
          is_active?: boolean
          trigger_event?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          sequence_type?: string
          is_active?: boolean
          trigger_event?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          name: string
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_groups: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string
          color: string
          icon: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          name: string
          description?: string
          color?: string
          icon?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string
          color?: string
          icon?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          id: string
          document_id: string
          shared_by: string
          organization_id: string
          share_type: string
          shared_with_users: string[]
          can_view: boolean
          can_edit: boolean
          can_reshare: boolean
          share_message: string
          metadata: unknown
          created_at: string
          expires_at: string
        }
        Insert: {
          id: string
          document_id: string
          shared_by: string
          organization_id: string
          share_type: string
          shared_with_users?: string[]
          can_view?: boolean
          can_edit?: boolean
          can_reshare?: boolean
          share_message?: string
          metadata?: unknown
          created_at: string
          expires_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          shared_by?: string
          organization_id?: string
          share_type?: string
          shared_with_users?: string[]
          can_view?: boolean
          can_edit?: boolean
          can_reshare?: boolean
          share_message?: string
          metadata?: unknown
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      email_sequence_steps: {
        Row: {
          id: string
          sequence_id: string
          step_number: number
          delay_days: number
          delay_hours: number
          subject: string
          email_template: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          sequence_id?: string
          step_number: number
          delay_days?: number
          delay_hours?: number
          subject: string
          email_template: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sequence_id?: string
          step_number?: number
          delay_days?: number
          delay_hours?: number
          subject?: string
          email_template?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          is_super_admin: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
          last_sign_in_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          is_super_admin?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          is_super_admin?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description: string
          icon: string
          category: string
          nodes: unknown
          edges: unknown
          trigger_type: string
          trigger_config: unknown
          enabled: boolean
          is_template: boolean
          is_public: boolean
          timeout_seconds: number
          max_retries: number
          total_runs: number
          successful_runs: number
          failed_runs: number
          last_run_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description?: string
          icon?: string
          category?: string
          nodes: unknown
          edges: unknown
          trigger_type: string
          trigger_config?: unknown
          enabled?: boolean
          is_template?: boolean
          is_public?: boolean
          timeout_seconds?: number
          max_retries?: number
          total_runs?: number
          successful_runs?: number
          failed_runs?: number
          last_run_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          name?: string
          description?: string
          icon?: string
          category?: string
          nodes?: unknown
          edges?: unknown
          trigger_type?: string
          trigger_config?: unknown
          enabled?: boolean
          is_template?: boolean
          is_public?: boolean
          timeout_seconds?: number
          max_retries?: number
          total_runs?: number
          successful_runs?: number
          failed_runs?: number
          last_run_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          id: string
          email: string
          full_name: string
          company_name: string
          phone: string
          preferred_date: string
          preferred_time: string
          company_size: string
          budget_range: string
          utm_source: string
          utm_medium: string
          utm_campaign: string
          referrer: string
          status: string
          scheduled_at: string
          completed_at: string
          notes: string
          admin_notes: string
          user_id: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          company_name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          company_size?: string
          budget_range?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          referrer?: string
          status?: string
          scheduled_at?: string
          completed_at?: string
          notes?: string
          admin_notes?: string
          user_id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          company_name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          company_size?: string
          budget_range?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          referrer?: string
          status?: string
          scheduled_at?: string
          completed_at?: string
          notes?: string
          admin_notes?: string
          user_id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_tags_master: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      document_access_logs: {
        Row: {
          id: string
          document_id: string
          user_id: string
          access_type: string
          metadata: unknown
          accessed_at: string
        }
        Insert: {
          id: string
          document_id: string
          user_id: string
          access_type: string
          metadata?: unknown
          accessed_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          access_type?: string
          metadata?: unknown
          accessed_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
          model_used: string
          tokens_used: number
          cost_usd: number
          user_id: string
        }
        Insert: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
          model_used?: string
          tokens_used?: number
          cost_usd?: number
          user_id?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
          model_used?: string
          tokens_used?: number
          cost_usd?: number
          user_id?: string
        }
        Relationships: []
      }
      team_analytics: {
        Row: {
          id: string
          organization_id: string
          metric_type: string
          metric_value: number
          metadata: unknown
          date: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          metric_type: string
          metric_value: number
          metadata?: unknown
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          metric_type?: string
          metric_value?: number
          metadata?: unknown
          date?: string
          created_at?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          activity_type: string
          entity_type: string
          entity_id: string
          metadata: unknown
          is_public: boolean
          visible_to_user_ids: string[]
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          activity_type: string
          entity_type: string
          entity_id: string
          metadata?: unknown
          is_public?: boolean
          visible_to_user_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          activity_type?: string
          entity_type?: string
          entity_id?: string
          metadata?: unknown
          is_public?: boolean
          visible_to_user_ids?: string[]
          created_at?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          id: string
          email_account_id: string
          organization_id: string
          user_id: string
          provider_message_id: string
          provider_thread_id: string
          provider: string
          subject: string
          from_email: string
          from_name: string
          to_emails: string[]
          cc_emails: string[]
          bcc_emails: string[]
          body_text: string
          body_html: string
          snippet: string
          labels: string[]
          category: string
          is_read: boolean
          is_starred: boolean
          is_important: boolean
          is_archived: boolean
          sent_at: string
          has_attachments: boolean
          ai_priority_score: number
          ai_category: string
          ai_summary: string
          ai_sentiment: string
          requires_response: boolean
          in_reply_to: string
          raw_headers: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email_account_id: string
          organization_id: string
          user_id: string
          provider_message_id: string
          provider_thread_id?: string
          provider: string
          subject?: string
          from_email: string
          from_name?: string
          to_emails: string[]
          cc_emails?: string[]
          bcc_emails?: string[]
          body_text?: string
          body_html?: string
          snippet?: string
          labels?: string[]
          category?: string
          is_read?: boolean
          is_starred?: boolean
          is_important?: boolean
          is_archived?: boolean
          sent_at?: string
          has_attachments?: boolean
          ai_priority_score?: number
          ai_category?: string
          ai_summary?: string
          ai_sentiment?: string
          requires_response?: boolean
          in_reply_to?: string
          raw_headers?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email_account_id?: string
          organization_id?: string
          user_id?: string
          provider_message_id?: string
          provider_thread_id?: string
          provider?: string
          subject?: string
          from_email?: string
          from_name?: string
          to_emails?: string[]
          cc_emails?: string[]
          bcc_emails?: string[]
          body_text?: string
          body_html?: string
          snippet?: string
          labels?: string[]
          category?: string
          is_read?: boolean
          is_starred?: boolean
          is_important?: boolean
          is_archived?: boolean
          sent_at?: string
          has_attachments?: boolean
          ai_priority_score?: number
          ai_category?: string
          ai_summary?: string
          ai_sentiment?: string
          requires_response?: boolean
          in_reply_to?: string
          raw_headers?: unknown
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          id: string
          execution_id: string
          workflow_id: string
          step_index: number
          step_name: string
          step_type: string
          config: unknown
          status: string
          input_data: unknown
          output_data: unknown
          assistant_id: string
          conversation_id: string
          started_at: string
          completed_at: string
          duration_ms: number
          error_message: string
          retry_count: number
          created_at: string
        }
        Insert: {
          id: string
          execution_id: string
          workflow_id: string
          step_index: number
          step_name: string
          step_type: string
          config: unknown
          status: string
          input_data?: unknown
          output_data?: unknown
          assistant_id?: string
          conversation_id?: string
          started_at?: string
          completed_at?: string
          duration_ms?: number
          error_message?: string
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          workflow_id?: string
          step_index?: number
          step_name?: string
          step_type?: string
          config?: unknown
          status?: string
          input_data?: unknown
          output_data?: unknown
          assistant_id?: string
          conversation_id?: string
          started_at?: string
          completed_at?: string
          duration_ms?: number
          error_message?: string
          retry_count?: number
          created_at?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          embedding: string
          token_count: number
          metadata: unknown
          created_at: string
        }
        Insert: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          embedding?: string
          token_count?: number
          metadata?: unknown
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          chunk_index?: number
          content?: string
          embedding?: string
          token_count?: number
          metadata?: unknown
          created_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          title: string
          content: string
          file_url: string
          file_type: string
          embedding: string
          created_at: string
          updated_at: string
          file_size: number
          status: string
          error_message: string
          metadata: unknown
          folder_id: string
          summary: string
          key_points: unknown
          document_type: string
          summary_generated_at: string
          summary_tokens_used: number
          summary_cost_usd: number
          visibility: string
          shared_with_user_ids: string[]
          shared_with_team_ids: string[]
          is_shareable: boolean
          share_message: string
          featured_in_spaces: string[]
          mentioned_in_conversations: string[]
          used_in_tasks: string[]
          viewed_by_user_ids: string[]
          view_count: number
          last_viewed_at: string
          ai_extracted_topics: string[]
          ai_related_document_ids: string[]
          ai_relevance_score: number
          last_accessed_at: string
          access_count: number
          relevance_score: number
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          title: string
          content: string
          file_url?: string
          file_type?: string
          embedding?: string
          created_at?: string
          updated_at?: string
          file_size?: number
          status: string
          error_message?: string
          metadata?: unknown
          folder_id?: string
          summary?: string
          key_points?: unknown
          document_type?: string
          summary_generated_at?: string
          summary_tokens_used?: number
          summary_cost_usd?: number
          visibility?: string
          shared_with_user_ids?: string[]
          shared_with_team_ids?: string[]
          is_shareable?: boolean
          share_message?: string
          featured_in_spaces?: string[]
          mentioned_in_conversations?: string[]
          used_in_tasks?: string[]
          viewed_by_user_ids?: string[]
          view_count?: number
          last_viewed_at?: string
          ai_extracted_topics?: string[]
          ai_related_document_ids?: string[]
          ai_relevance_score?: number
          last_accessed_at?: string
          access_count?: number
          relevance_score?: number
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          title?: string
          content?: string
          file_url?: string
          file_type?: string
          embedding?: string
          created_at?: string
          updated_at?: string
          file_size?: number
          status?: string
          error_message?: string
          metadata?: unknown
          folder_id?: string
          summary?: string
          key_points?: unknown
          document_type?: string
          summary_generated_at?: string
          summary_tokens_used?: number
          summary_cost_usd?: number
          visibility?: string
          shared_with_user_ids?: string[]
          shared_with_team_ids?: string[]
          is_shareable?: boolean
          share_message?: string
          featured_in_spaces?: string[]
          mentioned_in_conversations?: string[]
          used_in_tasks?: string[]
          viewed_by_user_ids?: string[]
          view_count?: number
          last_viewed_at?: string
          ai_extracted_topics?: string[]
          ai_related_document_ids?: string[]
          ai_relevance_score?: number
          last_accessed_at?: string
          access_count?: number
          relevance_score?: number
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          status: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          role: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          user_id: string
          content: string
          parent_comment_id: string
          mentioned_user_ids: string[]
          reactions: unknown
          is_deleted: boolean
          deleted_at: string
          is_edited: boolean
          edited_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          entity_type: string
          entity_id: string
          user_id: string
          content: string
          parent_comment_id?: string
          mentioned_user_ids?: string[]
          reactions?: unknown
          is_deleted?: boolean
          deleted_at?: string
          is_edited?: boolean
          edited_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: string
          entity_id?: string
          user_id?: string
          content?: string
          parent_comment_id?: string
          mentioned_user_ids?: string[]
          reactions?: unknown
          is_deleted?: boolean
          deleted_at?: string
          is_edited?: boolean
          edited_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_tags: {
        Row: {
          id: string
          document_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id: string
          document_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          id: string
          user_id: string
          step_key: string
          completed: boolean
          completed_at: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          step_key: string
          completed?: boolean
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step_key?: string
          completed?: boolean
          completed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          twilio_message_sid: string
          from_number: string
          to_number: string
          body: string
          direction: string
          status: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          twilio_message_sid?: string
          from_number: string
          to_number: string
          body: string
          direction: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          twilio_message_sid?: string
          from_number?: string
          to_number?: string
          body?: string
          direction?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      conversation_stats: {
        Row: {
          conversation_id: string
          title: string
          organization_id: string
          participant_count: number
          message_count: number
          last_message_at: string
          total_tokens_used: number
          total_cost_usd: number
        }
        Insert: {
          conversation_id?: string
          title?: string
          organization_id?: string
          participant_count?: number
          message_count?: number
          last_message_at?: string
          total_tokens_used?: number
          total_cost_usd?: number
        }
        Update: {
          conversation_id?: string
          title?: string
          organization_id?: string
          participant_count?: number
          message_count?: number
          last_message_at?: string
          total_tokens_used?: number
          total_cost_usd?: number
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          permission_id: string
          resource_id: string
          granted: boolean
          granted_by: string
          granted_at: string
          expires_at: string
        }
        Insert: {
          id: string
          user_id: string
          permission_id: string
          resource_id?: string
          granted?: boolean
          granted_by?: string
          granted_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          permission_id?: string
          resource_id?: string
          granted?: boolean
          granted_by?: string
          granted_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      document_folders: {
        Row: {
          id: string
          document_id: string
          folder_id: string
          added_by: string
          added_at: string
          position: number
        }
        Insert: {
          id: string
          document_id: string
          folder_id: string
          added_by?: string
          added_at?: string
          position?: number
        }
        Update: {
          id?: string
          document_id?: string
          folder_id?: string
          added_by?: string
          added_at?: string
          position?: number
        }
        Relationships: []
      }
      knowledge_spaces: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string
          space_type: string
          emoji: string
          color: string
          owner_id: string
          member_ids: string[]
          moderator_ids: string[]
          default_folder_id: string
          featured_document_ids: string[]
          pinned_conversation_ids: string[]
          is_private: boolean
          is_archived: boolean
          rag_enabled: boolean
          rag_scope: string
          auto_tag_rules: unknown
          auto_share_rules: unknown
          document_count: number
          member_count: number
          conversation_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          name: string
          description?: string
          space_type: string
          emoji?: string
          color?: string
          owner_id: string
          member_ids?: string[]
          moderator_ids?: string[]
          default_folder_id?: string
          featured_document_ids?: string[]
          pinned_conversation_ids?: string[]
          is_private?: boolean
          is_archived?: boolean
          rag_enabled?: boolean
          rag_scope?: string
          auto_tag_rules?: unknown
          auto_share_rules?: unknown
          document_count?: number
          member_count?: number
          conversation_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string
          space_type?: string
          emoji?: string
          color?: string
          owner_id?: string
          member_ids?: string[]
          moderator_ids?: string[]
          default_folder_id?: string
          featured_document_ids?: string[]
          pinned_conversation_ids?: string[]
          is_private?: boolean
          is_archived?: boolean
          rag_enabled?: boolean
          rag_scope?: string
          auto_tag_rules?: unknown
          auto_share_rules?: unknown
          document_count?: number
          member_count?: number
          conversation_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          metric_type: string
          metric_value: number
          metadata: unknown
          date: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          metric_type: string
          metric_value: number
          metadata?: unknown
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_type?: string
          metric_value?: number
          metadata?: unknown
          date?: string
          created_at?: string
        }
        Relationships: []
      }
      beta_invitations: {
        Row: {
          id: string
          email: string
          invitation_code: string
          organization_id: string
          invited_by: string
          status: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          invitation_code: string
          organization_id?: string
          invited_by?: string
          status?: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          invitation_code?: string
          organization_id?: string
          invited_by?: string
          status?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          title: string
          message: string
          type: string
          link_url: string
          action_required: boolean
          is_read: boolean
          read_at: string
          metadata: unknown
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          organization_id: string
          title: string
          message: string
          type: string
          link_url?: string
          action_required?: boolean
          is_read?: boolean
          read_at?: string
          metadata?: unknown
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          title?: string
          message?: string
          type?: string
          link_url?: string
          action_required?: boolean
          is_read?: boolean
          read_at?: string
          metadata?: unknown
          created_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          google_event_id: string
          title: string
          description: string
          start_time: string
          end_time: string
          location: string
          attendees: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          google_event_id?: string
          title: string
          description?: string
          start_time: string
          end_time: string
          location?: string
          attendees?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          google_event_id?: string
          title?: string
          description?: string
          start_time?: string
          end_time?: string
          location?: string
          attendees?: unknown
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          title: string
          model: string
          created_at: string
          updated_at: string
          project_id: string
          is_team: boolean
          context_scope: string
          context_space_id: string
          context_document_ids: string[]
        }
        Insert: {
          id: string
          organization_id: string
          user_id: string
          title: string
          model: string
          created_at?: string
          updated_at?: string
          project_id?: string
          is_team?: boolean
          context_scope?: string
          context_space_id?: string
          context_document_ids?: string[]
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          title?: string
          model?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          is_team?: boolean
          context_scope?: string
          context_space_id?: string
          context_document_ids?: string[]
        }
        Relationships: []
      }
      recognized_patterns: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          pattern_type: string
          pattern_name: string
          pattern_description: string
          pattern_data: unknown
          conditions: unknown
          occurrence_count: number
          frequency: string
          confidence: number
          first_seen_at: string
          last_seen_at: string
          evidence_sources: unknown
          context_tags: string[]
          related_patterns: string[]
          is_active: boolean
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          user_id?: string
          pattern_type: string
          pattern_name: string
          pattern_description: string
          pattern_data: unknown
          conditions?: unknown
          occurrence_count?: number
          frequency?: string
          confidence?: number
          first_seen_at?: string
          last_seen_at?: string
          evidence_sources?: unknown
          context_tags?: string[]
          related_patterns?: string[]
          is_active?: boolean
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          pattern_type?: string
          pattern_name?: string
          pattern_description?: string
          pattern_data?: unknown
          conditions?: unknown
          occurrence_count?: number
          frequency?: string
          confidence?: number
          first_seen_at?: string
          last_seen_at?: string
          evidence_sources?: unknown
          context_tags?: string[]
          related_patterns?: string[]
          is_active?: boolean
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_contributor_stats: {
        Row: {
          user_id: string
          full_name: string
          email: string
          organization_id: string
          total_contributions: number
          documents_contributed: number
          training_contributed: number
          conversations_contributed: number
          total_views: number
          total_shares: number
          total_helpful_votes: number
        }
        Insert: {
          user_id?: string
          full_name?: string
          email?: string
          organization_id?: string
          total_contributions?: number
          documents_contributed?: number
          training_contributed?: number
          conversations_contributed?: number
          total_views?: number
          total_shares?: number
          total_helpful_votes?: number
        }
        Update: {
          user_id?: string
          full_name?: string
          email?: string
          organization_id?: string
          total_contributions?: number
          documents_contributed?: number
          training_contributed?: number
          conversations_contributed?: number
          total_views?: number
          total_shares?: number
          total_helpful_votes?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_chunks: {
        Args: {
          filter_user_id: string
          match_count: number
          match_threshold: number
          query_embedding: number[]
        }
        Returns: {
          id: string
          document_id: string
          document_title: string
          content: string
          similarity: number
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never
