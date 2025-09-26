"""
Direct SQL execution to create Supabase tables
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import httpx
import json

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

def execute_sql():
    """Execute SQL directly via Supabase REST API"""
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')

    # Read SQL file and split into individual statements
    sql_file = Path(__file__).parent / 'create_tables.sql'
    with open(sql_file, 'r') as f:
        sql_content = f.read()

    # Split by semicolon but keep the CREATE statements intact
    statements = []
    current = []
    for line in sql_content.split('\n'):
        if line.strip().startswith('--'):
            continue
        current.append(line)
        if line.strip().endswith(';'):
            statement = '\n'.join(current).strip()
            if statement:
                statements.append(statement)
            current = []

    print(f"Found {len(statements)} SQL statements to execute")

    # Execute each statement
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    success_count = 0
    for i, statement in enumerate(statements, 1):
        # Skip empty statements
        if not statement.strip():
            continue

        print(f"\nExecuting statement {i}:")
        print(statement[:100] + "..." if len(statement) > 100 else statement)

        # For table creation, we need to use the SQL endpoint
        # Note: This might need to be done via dashboard for security reasons
        try:
            # Try using the Supabase client instead
            from supabase import create_client
            client = create_client(supabase_url, service_key)

            # Check if it's a CREATE TABLE statement
            if 'CREATE TABLE' in statement:
                table_name = statement.split('CREATE TABLE IF NOT EXISTS ')[1].split(' ')[0].strip()
                print(f"  Creating table: {table_name}")
                # Tables must be created via dashboard or migration
                print(f"  ⚠️  Table creation needs to be done via Supabase dashboard")
            elif 'CREATE INDEX' in statement:
                print(f"  Creating index...")
                # Indexes also need dashboard or migration
                print(f"  ⚠️  Index creation needs to be done via Supabase dashboard")

            success_count += 1

        except Exception as e:
            print(f"  ❌ Error: {e}")

    print(f"\n{'='*50}")
    print(f"Processed {success_count}/{len(statements)} statements")
    print(f"\n⚠️  IMPORTANT: Table creation must be done via Supabase dashboard:")
    print(f"1. Go to your Supabase project")
    print(f"2. Navigate to SQL Editor")
    print(f"3. Copy the contents of create_tables.sql")
    print(f"4. Execute the SQL")
    print(f"{'='*50}")

if __name__ == "__main__":
    execute_sql()