// App.js

import "./App.css";
import io from "socket.io-client";
import {useEffect, useState} from "react";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useAccount} from "wagmi";

const socket = io.connect("http://localhost:3001");

function App() {
  const [room, setRoom] = useState("");
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [peerWalletAddress, setPeerWalletAddress] = useState("");

  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
    }
  };

  const {address: walletAddress, isConnected: walletConnected} = useAccount();
  const connectToPeer = () => {
    socket.emit("connect_to_peer", walletAddress);
  };

  useEffect(() => {
    socket.on("peer_connected", (peerAddress) => {
      setIsPeerConnected(true);
      setPeerWalletAddress(peerAddress);
    });

    socket.on("peer_disconnected", () => {
      setIsPeerConnected(false);
      setPeerWalletAddress("");
    });

    if (walletConnected !== undefined) {
      socket.emit("connect_wallet", walletAddress);
    }

    socket.on("receive_message", (data) => {
      // Handle received messages
    });

    // Cleanup when the component unmounts
    return () => {
      socket.emit("disconnect_peer", walletAddress);
      socket.disconnect();
    };
  }, [walletAddress, walletConnected]);

  return (
    <div className="App">
      {!walletConnected && (
        <>
          <input
            placeholder="Room Number..."
            onChange={(event) => {
              setRoom(event.target.value);
            }}
          />
          <button onClick={joinRoom}> Join Room</button>
        </>
      )}
      <ConnectButton />
      {walletConnected && !isPeerConnected && (
        <button onClick={connectToPeer}> Connect to a Peer</button>
      )}

      {isPeerConnected && (
        <p>Connected to peer with wallet address: {peerWalletAddress}</p>
      )}

      {/* Other UI components... */}
    </div>
  );
}

export default App;
