// Socket utilities

// Format notification data from database to client format
function formatNotificationForClient(notification) {
  return {
    id: notification.id,
    userId: notification.user_id,
    message: notification.message,
    type: notification.type,
    relatedId: notification.related_id,
    isRead: notification.is_read,
    metadata: notification.metadata,
    createdAt: notification.created_at
  };
}

// Emit notification to specific user
function emitNotificationToUser(io, connectedUsers, userId, notification) {
  const targetSocketId = connectedUsers.get(userId);
  
  if (targetSocketId) {
    const formattedNotification = typeof notification.user_id === 'string' 
      ? formatNotificationForClient(notification)
      : notification;
      
    io.to(targetSocketId).emit('notification', formattedNotification);
    console.log(`Notification sent to user ${userId}`);
    return true;
  } else {
    console.log(`User ${userId} is not connected, notification not delivered`);
    return false;
  }
}

// Broadcast notification to multiple users
function broadcastNotification(io, connectedUsers, userIds, notification) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return false;
  }
  
  const room = `notification-${Date.now()}`;
  
  // Add all connected users to a temporary room
  userIds.forEach(userId => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.sockets.sockets.get(socketId).join(room);
    }
  });
  
  // Broadcast to the room
  io.to(room).emit('notification', notification);
  
  // Remove room after broadcast
  setTimeout(() => {
    io.in(room).socketsLeave(room);
  }, 100);
  
  return true;
}

// Get online status for a list of users
function getUsersOnlineStatus(connectedUsers, userIds) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return {};
  }
  
  const onlineStatus = {};
  
  userIds.forEach(userId => {
    onlineStatus[userId] = connectedUsers.has(userId);
  });
  
  return onlineStatus;
}

module.exports = {
  formatNotificationForClient,
  emitNotificationToUser,
  broadcastNotification,
  getUsersOnlineStatus
}; 