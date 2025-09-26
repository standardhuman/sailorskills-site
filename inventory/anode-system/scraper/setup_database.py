"""
Setup Supabase database tables for anode catalog
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
import psycopg2
from urllib.parse import urlparse

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

def get_db_connection_string():
    """Extract database connection from Supabase URL"""
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    # Parse the URL to get the project ID
    parsed = urlparse(supabase_url)
    project_id = parsed.hostname.split('.')[0]

    # Standard Supabase database connection format
    # Note: You'll need to get the actual database password from Supabase dashboard
    return f"postgresql://postgres.[project_id]:[password]@db.{project_id}.supabase.co:5432/postgres"

def setup_tables_via_api():
    """Create tables using Supabase client (alternative method)"""
    try:
        # Initialize Supabase client
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

        supabase = create_client(supabase_url, supabase_key)

        print("Supabase client initialized successfully")
        print(f"URL: {supabase_url}")

        # Read SQL file
        sql_file = Path(__file__).parent / 'create_tables.sql'
        with open(sql_file, 'r') as f:
            sql_content = f.read()

        print("\nSQL to execute:")
        print(sql_content[:500] + "..." if len(sql_content) > 500 else sql_content)

        print("\n" + "="*50)
        print("Tables need to be created via Supabase dashboard:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Navigate to your project")
        print("3. Go to SQL Editor")
        print("4. Copy and paste the contents of create_tables.sql")
        print("5. Run the query")
        print("="*50)

        # Test if tables exist
        try:
            result = supabase.table('anodes_catalog').select('*').limit(1).execute()
            print("\n✓ anodes_catalog table exists!")
        except Exception as e:
            print("\n✗ anodes_catalog table does not exist yet")
            print(f"  Error: {e}")

        try:
            result = supabase.table('anode_sync_logs').select('*').limit(1).execute()
            print("✓ anode_sync_logs table exists!")
        except Exception as e:
            print("✗ anode_sync_logs table does not exist yet")
            print(f"  Error: {e}")

        try:
            result = supabase.table('anode_price_history').select('*').limit(1).execute()
            print("✓ anode_price_history table exists!")
        except Exception as e:
            print("✗ anode_price_history table does not exist yet")
            print(f"  Error: {e}")

    except Exception as e:
        print(f"Error setting up database: {e}")
        return False

    return True

if __name__ == "__main__":
    print("Setting up Supabase tables for anode catalog...")
    success = setup_tables_via_api()

    if success:
        print("\n✅ Database setup check completed!")
    else:
        print("\n❌ Database setup failed")
        sys.exit(1)