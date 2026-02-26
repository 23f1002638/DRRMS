# DRRMS - Disaster Relief Resource Management System

A comprehensive disaster relief management system built with React, TypeScript, and Supabase. This platform connects victims, donors, volunteers, and administrators to deliver rapid, coordinated emergency response and humanitarian aid.

The original Figma design is available at: https://www.figma.com/design/hcsKV6uWfARHv1GGFyVh5e/Disaster-Relief-Resource-Management-System

## Features

- **Role-Based Access Control**: Specialized dashboards for Admins, Donors, Volunteers, and Victims
- **Real-Time Analytics**: Live data visualization for tracking donations, aid distribution, and impact metrics
- **Geolocation Mapping**: Interactive maps to track aid requests, resources, and volunteer assignments
- **Inventory Management**: Comprehensive tracking system for supplies and resource allocation
- **Volunteer Coordination**: Efficient task assignment with skill-based matching
- **Instant Aid Requests**: Streamlined request forms with priority classification

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/23f1002638/DRRMS.git
   cd DRRMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   - Go to your Supabase Dashboard → SQL Editor
   - Run the SQL script from `supabase_schema.sql` to create tables, triggers, and policies
   - Run the fix script from `fix_signup_comprehensive.sql` to ensure proper authentication flow

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## Security Notes

### Admin Account Creation

For security, admin accounts cannot be created through the public sign-up form. To create an admin account:

1. Sign up as a regular user (Volunteer, Donor, or Victim)
2. Go to Supabase Dashboard → Table Editor → `profiles` table
3. Find your user and change the `role` field to `admin`
4. Refresh the application to access the Admin Dashboard

### Environment Variables

**IMPORTANT**: Never commit your `.env` file to GitHub. It contains sensitive Supabase credentials. The `.gitignore` file is configured to exclude it.

## User Roles

### Victim (Need Help)
- Submit aid requests
- Track request status
- Access emergency resources

### Donor (Want to Give)
- Make monetary donations
- Track donation impact
- View aid distribution

### Volunteer (Want to Help)
- View available tasks
- Accept assignments
- Track your impact

### Administrator
- Manage all users
- Coordinate resources
- Analyze operations
- Generate reports

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with love for communities in need.
