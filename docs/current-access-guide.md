# PerMeaTe Enterprise Access Guide

## 🔗 Direct Access Links

**PerMeaTe Enterprise Application**: 
- **Login**: http://localhost:5000/permeate-login
- **Register**: http://localhost:5000/permeate-register  
- **Dashboard**: http://localhost:5000/permeate-dashboard

## 🏢 Test Company Setup

Since you're running the React + Express version, you'll need to:

### Option 1: Register New Account
1. Go to: http://localhost:5000/permeate-register
2. Create admin account:
   - **Email**: admin@democo.com
   - **Password**: admin123
   - **Company**: DemoCo Enterprise
   - **Role**: Administrator

### Option 2: Use Bootstrap/Demo Credentials
If demo data exists, try these credentials:
- **Email**: admin@democo.com
- **Password**: admin123

## 🎯 Testing Flow

1. **Start at Registration**: http://localhost:5000/permeate-register
   - Create your admin account
   - Set up company workspace

2. **Login**: http://localhost:5000/permeate-login
   - Use your created credentials
   - Access dashboard

3. **Dashboard**: http://localhost:5000/permeate-dashboard
   - Explore enterprise features
   - Set up organizational structure
   - Test analytics and management tools

## 🚀 Current Status

- **App Running**: ✅ Port 5000
- **React Frontend**: ✅ Loaded
- **Express Backend**: ✅ Running
- **Database**: ⚠️ Connection issues (check logs)

## 🔧 Troubleshooting

If login fails:
1. Check database connection in terminal logs
2. Try registration first to create account
3. Verify API endpoints at `/api/permeate/*`

The database connection issues might prevent authentication, so you may need to address the PostgreSQL connection first.

## 📱 Additional Dark Street Tech Apps

While testing PerMeaTe Enterprise, you also have access to:
- **Main App**: http://localhost:5000/ 
- **Fetch Patterns**: http://localhost:5000/fetch-patterns
- **Beta Login**: http://localhost:5000/beta-login