// App.js

import "./App.css";
import io from "socket.io-client";
import {useEffect, useState} from "react";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useAccount} from "wagmi";
import {PushAPI} from "@pushprotocol/restapi";
import {useWalletClient} from "wagmi";
const socket = io.connect("http://localhost:3001");

function App() {
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [peerWalletAddress, setPeerWalletAddress] = useState("");

  const {address: walletAddress, isConnected: walletConnected} = useAccount();
  const connectToPeer = () => {
    socket.emit("connect_to_peer", walletAddress);
  };

  const {data: walletClient} = useWalletClient();
  const sendChatRequest = async () => {
    console.log("clickeed");
    const userAlice = await PushAPI.initialize(walletClient, {env: "staging"});

    // Send a message to Bob
    const aliceMessagesBob = await userAlice.chat.send(peerWalletAddress, {
      content: "Gm gm! It's a me... Mario",
    });
    console.log(aliceMessagesBob);
  };
  useEffect(() => {
    console.log(walletClient);
    sendChatRequest();
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

    // Cleanup when the component unmounts
    return () => {
      socket.emit("disconnect_peer", walletAddress);
      socket.disconnect();
    };
  }, [walletAddress, walletConnected]);

  return (
    <div className="App">
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
