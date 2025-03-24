# TrackerPro Server

This is the backend server for the TrackerPro habit tracking application. It handles real-time notifications, socket connections, and provides APIs for habit tracking and notification management.

## Features

- Real-time notifications via Socket.io
- RESTful API for notifications and habits
- Integration with Supabase for database operations
- Support for various notification types (reminders, streaks, achievements)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
2. Navigate to the server directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example` and fill in your configuration details:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Running the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

## API Endpoints

### Notifications

- `GET /api/notifications/:userId` - Get all notifications for a user
- `GET /api/notifications/unread/:userId` - Get unread notification count for a user
- `PATCH /api/notifications/:id/read` - Mark a notification as read
- `PATCH /api/notifications/read-all/:userId` - Mark all notifications as read for a user
- `DELETE /api/notifications/:id` - Delete a notification
- `POST /api/notifications` - Create a new notification

### Habits

- `POST /api/habits/reminder` - Create a habit reminder notification
- `POST /api/habits/streak` - Create a streak achievement notification

## Socket Events

### Emitted Events

- `notification` - Emitted when a new notification is created
- `friendRequest` - Emitted when a friend request is sent
- `friendRequestAccepted` - Emitted when a friend request is accepted
- `challengeJoined` - Emitted when a user joins a challenge
- `challengeLeft` - Emitted when a user leaves a challenge
- `challengeUpdated` - Emitted when a challenge is updated

### Listened Events

- `notification` - Listen for notification creation requests
- `friendRequest` - Listen for friend request events
- `friendRequestAccepted` - Listen for friend request accepted events
- `challengeJoined` - Listen for challenge joined events
- `challengeLeft` - Listen for challenge left events
- `challengeUpdated` - Listen for challenge updated events

## License

MIT
