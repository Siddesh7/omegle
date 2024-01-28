const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true,
  },
});

let users = [];

io.on("connection", (socket) => {
  console.log(`User connected with socket id: ${socket.id}`);
  socket.on("connect_wallet", (walletAddress, route) => {
    const userCaller = users.findIndex(
      (user) => user.id === socket.id || user.walletAddress === walletAddress
    );
    if (userCaller !== -1) {
      users[userCaller].walletAddress = walletAddress;
    } else {
      users.push({
        walletAddress,
        id: socket.id,
        online: true,
        busy: false,
        lookingForPeers: true,
        connectedPeerId: null,
        hasTokens: null,
        route: null,
      });
    }
    if (route === "/") {
      io.to(socket.id).emit("ready_to_connect");
    }
  });
  socket.on("token_gated_check", (balance, route) => {
    const userCaller = users.findIndex((user) => user.id === socket.id);
    if (userCaller !== -1) {
      if (balance > 0) {
        users[userCaller].hasTokens = true;
        users[userCaller].route = route;
      } else {
        users[userCaller].hasTokens = false;
        users[userCaller].route = route;
      }
    }

    io.to(socket.id).emit("ready_to_connect");
  });
  socket.on("wallet_disconnected", () => {
    const userIndex = users.findIndex((user) => user.id === socket.id);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
  socket.on("user_status_toggle", (newStatus) => {
    const userIndex = users.findIndex((user) => user.id === socket.id);
    if (userIndex !== -1) users[userIndex].lookingForPeers = newStatus;
  });
  socket.on("connect_to_peer", (walletAddress) => {
    const caller = users.find((user) => user.id === socket.id);
    if (!caller || !caller.walletAddress) {
      io.to(socket.id).emit("error");
      return;
    }
    if (caller && caller.busy) {
      return;
    }
    let availableUsers;
    if (caller.route !== "/" && caller.hasTokens) {
      availableUsers = users.filter(
        (user) =>
          user.walletAddress !== walletAddress &&
          user.id !== caller.id &&
          user.walletAddress !== null &&
          user.online &&
          user.lookingForPeers &&
          !user.busy &&
          user.route === caller.route &&
          user.hasTokens
      );
    } else {
      availableUsers = users.filter(
        (user) =>
          user.walletAddress !== walletAddress &&
          user.id !== caller.id &&
          user.walletAddress !== null &&
          user.online &&
          user.lookingForPeers &&
          !user.busy &&
          user.route === caller.route
      );
    }
    if (availableUsers.length > 0) {
      const chosenItem =
        availableUsers[Math.floor(Math.random() * availableUsers.length)];
      const userIndexCaller = users.findIndex((user) => user.id === socket.id);
      const userIndexPeer = users.findIndex(
        (user) => user.walletAddress === chosenItem.walletAddress
      );

      if (userIndexCaller !== -1 && userIndexPeer !== -1) {
        io.to(socket.id).emit("peer_matched", chosenItem.walletAddress);
        io.to(chosenItem.id).emit("incoming_peer_request");
        users[userIndexCaller].busy = true;
        users[userIndexPeer].busy = true;
        users[userIndexCaller].lookingForPeers = false;
        users[userIndexPeer].lookingForPeers = false;
        users[userIndexCaller].connectedPeerId = chosenItem.id;
        users[userIndexPeer].connectedPeerId = caller.id;
      } else {
        io.to(socket.id).emit("no_active_peers_found", walletAddress);
      }
    } else {
      io.to(socket.id).emit("no_active_peers_found", walletAddress);
      console.log("No valid user found.");
    }
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected with socket id: ${socket.id}`);

    const id = socket.id;
    if (id) {
      const userIndex = users.findIndex((user) => user.id === id);

      // Check if the user is found
      if (userIndex !== -1) {
        const disconnectedUser = users[userIndex];
        users.splice(userIndex, 1);

        console.log("Updated Users Array:", users);

        // Emit "peer_disconnected" only to the connected peer
        const connectedPeerSocket = io.sockets.sockets.get(
          disconnectedUser.connectedPeerId
        );
        if (connectedPeerSocket) {
          connectedPeerSocket.emit("peer_disconnected");
        }
        // Update the connected peer's properties
        const connectedPeerIndex = users.findIndex(
          (user) => user.id === disconnectedUser.connectedPeerId
        );
        if (connectedPeerIndex !== -1) {
          users[connectedPeerIndex].busy = false;
          users[connectedPeerIndex].lookingForPeers = true;
        }
      }
    }
  });

  socket.on("chat_message_sent", (peerAddress) => {
    const peerSocket = users.find((user) => user.walletAddress === peerAddress);
    const currUserSocket = users.find((user) => user.id === socket.id);
    if (peerSocket) {
      io.to(peerSocket.id).emit(
        "chat_message_request",
        currUserSocket.walletAddress
      );
    }
  });
  socket.on("intent_accepted", (peerAddress) => {
    const peerSocket = users.find((user) => user.walletAddress === peerAddress);
    const currUserSocket = users.find((user) => user.id === socket.id);
    if (peerSocket) {
      io.to(peerSocket.id).emit(
        "intent_accepted_by_peer",
        currUserSocket.walletAddress
      );
      io.to(socket.id).emit("intent_accepted_by_peer", peerAddress);
    }
  });
  socket.on("chat_exists_w_peer", (peerAddress) => {
    const peerSocket = users.find((user) => user.walletAddress === peerAddress);
    const currUserSocket = users.find((user) => user.id === socket.id);
    if (peerSocket) {
      io.to(peerSocket.id).emit(
        "chat_exists_bw_users",
        currUserSocket.walletAddress
      );
      io.to(socket.id).emit("chat_exists_bw_users", peerAddress);
    }
  });

  socket.on("endPeerConnection", () => {
    const currUserSocket = users.find((user) => user.id === socket.id);
    if (currUserSocket) {
      if (currUserSocket.walletAddress) {
        const userIndex = users.findIndex(
          (user) => user.walletAddress === currUserSocket.walletAddress
        );
        const userIndexPeer = users.findIndex(
          (user) => user.id === users[userIndex].connectedPeerId
        );
        // Instead of removing the user entry, update its properties
        if (userIndex !== -1) {
          users[userIndex].busy = false;
          users[userIndex].lookingForPeers = true;
        }
        if (userIndexPeer !== -1) {
          users[userIndexPeer].busy = false;
          users[userIndexPeer].lookingForPeers = true;
          users[userIndexPeer].connectedPeerId = null;
        }
        io.to(userIndexPeer.id).emit("peer_disconnected_call");
      }
    }
  });
});
// Function to log users every 10 seconds
function logUsers() {
  console.log("-------------------Connected Users:--------------------------");
  users.forEach((user) => {
    console.log(
      `Wallet Address: ${user.walletAddress}, Online: ${user.online}, Busy: ${user.busy}, LookingForPeer: ${user.lookingForPeers} socket: ${user.id} Connected Peer: ${user.connectedPeerId} Route: ${user.route} hasTokens: ${user.hasTokens}`
    );
  });
  console.log("-------------------------------------------------------------");
}

// Schedule the logUsers function to run every 10 seconds
setInterval(logUsers, 10000); // 10000 milliseconds = 10 seconds

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
