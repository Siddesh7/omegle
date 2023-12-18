// App.js

import "./App.css";
import io from "socket.io-client";
import {useEffect, useState} from "react";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useAccount} from "wagmi";
import {PushAPI} from "@pushprotocol/restapi";
import {} from "wagmi";
import {ethers} from "ethers";

const socket = io.connect("http://localhost:3001");

function App() {
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [peerWalletAddress, setPeerWalletAddress] = useState("");

  const {address: walletAddress, isConnected: walletConnected} = useAccount();
  const connectToPeer = () => {
    socket.emit("connect_to_peer", walletAddress);
  };

  // const provider = new ethers.providers.JsonRpcProvider(
  //   "https://eth-sepolia.g.alchemy.com/v2/bDT1MTPLZ4EgJq4kQmdY1cJjzhF4MCY5"
  // );
  // const signer = provider.getSigner();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const sendChatRequest = async (peerAddress) => {
    console.log("clickeed");
    console.log(peerAddress);
    const userAlice = await PushAPI.initialize(signer, {env: "staging"});

    // Send a message to Bob
    const aliceMessagesBob = await userAlice.chat.send(peerAddress, {
      content: "Gm gm! It's a me... Mario",
    });
    console.log(aliceMessagesBob);
  };
  useEffect(() => {
    socket.on("peer_connected", (peerAddress) => {
      console.log(peerAddress);
      setIsPeerConnected(true);
      setPeerWalletAddress(peerAddress);
      sendChatRequest(peerAddress);
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
