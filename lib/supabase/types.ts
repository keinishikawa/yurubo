/**
 * ファイル名: types.ts
 *
 * 【概要】
 * Supabaseデータベーススキーマから自動生成されたTypeScript型定義
 * `npx supabase gen types typescript --local` コマンドで生成
 *
 * 【処理フロー】
 * このファイルは手動編集せず、スキーマ変更時に再生成する
 * 1. マイグレーションでスキーマ変更
 * 2. `npx supabase gen types typescript --local > lib/supabase/types.ts` 実行
 * 3. 型定義が自動更新される
 *
 * 【主要型定義】
 * - Database: 全スキーマの型定義（public, graphql_publicなど）
 * - Tables<T>: テーブル行の型（SELECT結果）
 * - TablesInsert<T>: INSERT用の型（デフォルト値を持つカラムはオプション）
 * - TablesUpdate<T>: UPDATE用の型（すべてのカラムがオプション）
 * - Json: JSONB型のTypeScript表現
 *
 * 【使用例】
 * import { Database, Tables } from '@/lib/supabase/types'
 *
 * // イベント行の型
 * type Event = Tables<'events'>
 *
 * // イベント作成時の型（INSERT用）
 * type EventInsert = TablesInsert<'events'>
 *
 * // Supabaseクライアントに型を適用
 * const supabase = createClient<Database>()
 *
 * 【依存関係】
 * - Supabaseデータベーススキーマ（supabase/migrations/）
 * - @supabase/supabase-js（クライアントライブラリ）
 */

/**
 * Json型
 *
 * 【用途】PostgreSQLのJSONB型をTypeScriptで表現
 * 【例】notification_preferences, category_flagsなど
 *
 * 【型定義の意味】
 * - string | number | boolean | null: プリミティブ値
 * - { [key: string]: Json | undefined }: オブジェクト（再帰的）
 * - Json[]: 配列（再帰的）
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          display_order: number
          emoji: string
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          emoji: string
          label: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          emoji?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          category_flags: Json
          created_at: string
          target_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_flags?: Json
          created_at?: string
          target_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_flags?: Json
          created_at?: string
          target_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          anon_id: string
          capacity_max: number
          capacity_min: number
          category: string
          comment: string | null
          created_at: string
          date_end: string
          date_start: string
          deadline: string | null
          host_id: string
          id: string
          price_max: number | null
          price_min: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          anon_id: string
          capacity_max: number
          capacity_min: number
          category: string
          comment?: string | null
          created_at?: string
          date_end: string
          date_start: string
          deadline?: string | null
          host_id: string
          id?: string
          price_max?: number | null
          price_min?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          anon_id?: string
          capacity_max?: number
          capacity_min?: number
          category?: string
          comment?: string | null
          created_at?: string
          date_end?: string
          date_start?: string
          deadline?: string | null
          host_id?: string
          id?: string
          price_max?: number | null
          price_min?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          enabled_categories: string[]
          id: string
          notification_preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          enabled_categories?: string[]
          id: string
          notification_preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          enabled_categories?: string[]
          id?: string
          notification_preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

