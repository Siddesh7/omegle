import React, {useEffect, useRef, useState} from "react";
import io from "socket.io-client";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useAccount, useWalletClient} from "wagmi";

import Modal from "./components/Modal";
import {CONSTANTS, PushAPI, user} from "@pushprotocol/restapi";
import Video from "./video";

// Initializing the socket connection to the server

const socket = io.connect(process.env.REACT_APP_SERVER_URL);

// Main App component
function App() {
  // State variables
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [peerWalletAddress, setPeerWalletAddress] = useState("");
  const [showPeerDisconnectedModal, setShowPeerDisconnectedModal] =
    useState(false);
  const [showNoActivePeersModal, setShowNoActivePeersModal] = useState(false);
  const [peerMatched, setPeerMatched] = useState(false);
  const [videoCallInitiator, setVideoCallInitiator] = useState("");
  const {data: signer} = useWalletClient();

  // Retrieving wallet information using Wagmi hook
  const {address: walletAddress, isConnected: walletConnected} = useAccount();

  // Function to connect to a peer
  const connectToPeer = () => {
    socket.emit("connect_to_peer", walletAddress);
  };
  const userAlice = useRef();
  useEffect(() => {
    if (!signer) return;
    if (isPeerConnected) return;
    const initializeUserAlice = async () => {
      userAlice.current = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.DEV,
      });
    };
    initializeUserAlice();
  }, [signer, isPeerConnected]);
  useEffect(() => {
    // Event listener for peer connection
    socket.on("peer_matched", (peerAddress) => {
      console.log(peerAddress);
      // setIsPeerConnected(true);
      setPeerMatched(true);

      checkIfChatExists(peerAddress);
      setVideoCallInitiator(walletAddress);
    });

    // Event listener for peer disconnection
    socket.on("peer_disconnected", () => {
      setIsPeerConnected(false);
      setPeerWalletAddress("");
      // Show the modal on peer disconnection
      setShowPeerDisconnectedModal(true);
    });
    // Event listener for no active peers found
    socket.on("no_active_peers_found", () => {
      // Show the modal for no active peers found
      setShowNoActivePeersModal(true);
    });
    socket.on("video_call_request", async (peerAddress) => {
      console.log("video request Received");
      await userAlice.current.chat.accept(peerAddress);

      console.log("sedning intent accepted");
      socket.emit("intent_accepted", peerAddress);
    });
    socket.on("intent_accepted_by_peer", async (peerAddress) => {
      console.log("intent accepted by peer");

      setIsPeerConnected(true);
    });

    // Connect wallet to the server if connected
    if (walletConnected !== undefined) {
      socket.emit("connect_wallet", walletAddress);
    }
  }, [walletAddress, walletConnected]);
  const checkIfChatExists = async (peerAddress) => {
    const aliceChats = await userAlice.current.chat.list("CHATS");

    let chatExists = false;
    for (const chat of aliceChats) {
      if (chat.did.substring(7).toLowerCase() === peerAddress.toLowerCase()) {
        chatExists = true;
        console.log("chat exists so simplying emitting an event");
        socket.emit("intent_accepted", peerAddress);
        break; // Stop the loop when a chat exists
      }
    }
    if (!chatExists) {
      const aliceChatRequsts = await userAlice.current.chat.list("REQUESTS");
      for (const chat of aliceChatRequsts) {
        console.log("chat reuqest exists so approving");
        if (chat.did.substring(7).toLowerCase() === peerAddress.toLowerCase()) {
          chatExists = true;
          await userAlice.current.chat.accept(peerAddress);
          socket.emit("intent_accepted", peerAddress);
          break; // Stop the loop when a chat exists
        }
      }
    }
    if (!chatExists) {
      console.log("chat does not exist so creating a new chat");
      await userAlice.current.chat.send(peerAddress, {
        type: "Text",
        content: "Hi Peer, setting up a call!",
      });

      socket.emit("chat_message_sent", peerAddress);
    }
    console.log("ppppp", peerAddress);
    setPeerWalletAddress(peerAddress);
  };

  return (
    <div>
      <div className="hero min-h-screen bg-base-200">
        {!isPeerConnected ? (
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">Hello Anon!</h1>
              <p className="py-6">
                ik you're bored, fret not anon, time to make some random video
                calls with strangersssss.
              </p>
              <div className="flex flex-row gap-4 justify-center">
                <ConnectButton showBalance={false} />
                {walletConnected && !isPeerConnected && (
                  <button className="btn btn-primary" onClick={connectToPeer}>
                    Connect to a Peer
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Video
            peerAddress={peerWalletAddress}
            userAlice={userAlice.current}
            initiator={videoCallInitiator}
            emitPeerDisconnect={() => {
              socket.emit("disconnect_peer", peerWalletAddress);
            }}
          />
        )}
      </div>
      {/* Render PushChat component if connected to a peer */}
      {/* {isPeerConnected && (
        <PushChat chatId={peerWalletAddress} signer={signer} />
      )} */}

      {/* Render the modal when the peer is disconnected */}
      {showPeerDisconnectedModal && (
        <Modal
          text={"Peer Disconnected!"}
          onClose={() => {
            setShowPeerDisconnectedModal(false);
          }}
        />
      )}
      {/* Render the modal when no active peers are found */}
      {showNoActivePeersModal && (
        <Modal
          text={"No Active peers found!"}
          onClose={() => {
            setShowNoActivePeersModal(false);
          }}
        />
      )}
    </div>
  );
}

// Exporting the App component as the default export
export default App;
