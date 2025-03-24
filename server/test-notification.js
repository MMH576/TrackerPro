const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { io } = require('socket.io-client');

// Your user ID from Supabase
const userId = '6e85164e-4d19-4166-8d13-6f4a4c30b38f';
const serverUrl = 'http://localhost:3001';

// Create socket connection
const socket = io(serverUrl, {
  query: { userId }
});

// Socket event listeners
socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('notification', (notification) => {
  console.log('Received real-time notification:', notification);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// Test functions
async function createNotification(message = 'Test notification message') {
  try {
    console.log('\n📝 Creating notification...');
    const response = await fetch(`${serverUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message,
        type: 'system',
        metadata: { name: 'Test Notification' }
      })
    });

    const data = await response.json();
    console.log('Created notification:', data);
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

async function fetchNotifications() {
  try {
    console.log('\n📋 Fetching notifications...');
    const response = await fetch(`${serverUrl}/api/notifications/${userId}`);
    const data = await response.json();
    console.log('Fetched notifications:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

async function markAsRead(notificationId) {
  try {
    console.log('\n✓ Marking notification as read:', notificationId);
    const response = await fetch(`${serverUrl}/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    const data = await response.json();
    console.log('Marked as read:', data);
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
}

async function markAllAsRead() {
  try {
    console.log('\n✓✓ Marking all notifications as read...');
    const response = await fetch(`${serverUrl}/api/notifications/read-all/${userId}`, {
      method: 'PATCH'
    });
    const data = await response.json();
    console.log('Marked all as read:', data);
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return null;
  }
}

async function deleteNotification(notificationId) {
  try {
    console.log('\n🗑️ Deleting notification:', notificationId);
    const response = await fetch(`${serverUrl}/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    console.log('Delete status:', response.status);
    return response.status === 204;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

async function getUnreadCount() {
  try {
    console.log('\n🔢 Getting unread count...');
    const response = await fetch(`${serverUrl}/api/notifications/unread/${userId}`);
    const data = await response.json();
    console.log('Unread count:', data.count);
    return data.count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting notification system tests...\n');

  // 1. Create a test notification
  const notification = await createNotification();
  if (!notification) {
    console.error('❌ Failed to create notification');
    return;
  }

  // Wait for socket to receive the notification
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Fetch all notifications
  const notifications = await fetchNotifications();
  if (!notifications.length) {
    console.error('❌ No notifications found');
    return;
  }

  // 3. Get unread count
  const unreadCount = await getUnreadCount();
  console.log(`📊 Current unread count: ${unreadCount}`);

  // 4. Mark notification as read
  if (notification.id) {
    const updatedNotification = await markAsRead(notification.id);
    if (!updatedNotification) {
      console.error('❌ Failed to mark notification as read');
      return;
    }
  }

  // 5. Create multiple notifications for testing
  await Promise.all([
    createNotification('Test notification 1'),
    createNotification('Test notification 2'),
    createNotification('Test notification 3')
  ]);

  // 6. Mark all as read
  await markAllAsRead();

  // 7. Verify unread count is 0
  const finalUnreadCount = await getUnreadCount();
  console.log(`📊 Final unread count: ${finalUnreadCount}`);

  // 8. Delete the test notification
  if (notification.id) {
    const deleted = await deleteNotification(notification.id);
    if (!deleted) {
      console.error('❌ Failed to delete notification');
      return;
    }
  }

  console.log('\n✅ All tests completed successfully!');
  
  // Close socket connection
  socket.close();
  console.log('\n🔌 Socket connection closed');
}

// Run the tests
console.log('⚡ Starting notification system test suite...');
runTests().catch(console.error); 