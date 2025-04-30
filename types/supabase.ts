export interface Database {
  public: {
    Tables: {
      lead_sources: {
        Row: {
          id: string;
          name: string;
          file_name: string;
          metadata: {
            table_name: string;
            file_hash: string;
            column_types: Record<string, string>;
            record_count?: number;
            storage_path?: string;  // added storage path to metadata
          };
          last_imported: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_name: string;
          metadata: {
            table_name: string;
            file_hash: string;
            column_types: Record<string, string>;
            record_count?: number;
            storage_path?: string;  // added storage path
          };
          last_imported?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_name?: string;
          metadata?: {
            table_name?: string;
            file_hash?: string;
            column_types?: Record<string, string>;
            record_count?: number;
            storage_path?: string;  // added storage path
          };
          last_imported?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      check_table_exists: {
        Args: {
          table_name: string;
        };
        Returns: boolean;
      };
      exec_sql: {
        Args: {
          query: string;
        };
        Returns: unknown;
      };
    };
  };
}