import {
  CONSTANTS,
  VideoEventType,
  VideoCallStatus,
} from "@pushprotocol/restapi";
import {useAccount, useWalletClient} from "wagmi";

import {useEffect, useRef, useState} from "react";
import {initVideoCallData} from "@pushprotocol/restapi/src/lib/video";

import VideoFrame from "./components/VideoFrame";
import Loader from "./components/Loader";

const Video = ({
  peerAddress,
  userAlice,
  initiator,
  emitPeerDisconnect,
  onEndCall,
}) => {
  const {data: signer} = useWalletClient();
  const {address: walletAddress} = useAccount();
  const aliceVideoCall = useRef();
  const [isPushStreamConnected, setIsPushStreamConnected] = useState(false);
  console.log("peerAddress", peerAddress);
  const [data, setData] = useState(initVideoCallData);

  const initializePushAPI = async () => {
    const createdStream = await userAlice.initStream([
      CONSTANTS.STREAM.VIDEO,
      CONSTANTS.STREAM.CONNECT,
      CONSTANTS.STREAM.DISCONNECT,
    ]);

    createdStream.on(CONSTANTS.STREAM.CONNECT, () => {
      setIsPushStreamConnected(true);
    });

    createdStream.on(CONSTANTS.STREAM.DISCONNECT, () => {
      setIsPushStreamConnected(false);
    });

    createdStream.on(CONSTANTS.STREAM.VIDEO, async (data) => {
      console.log("Video Event", data);
      if (data.event === VideoEventType.RequestVideo) {
        await aliceVideoCall.current.approve(data?.peerInfo);
      }
      if (data.event === VideoEventType.DisconnectVideo) {
        createdStream.disconnect();
        emitPeerDisconnect();
      }
    });

    aliceVideoCall.current = await userAlice.video.initialize(setData, {
      stream: createdStream,
      config: {
        video: true,
        audio: true,
      },
    });

    await createdStream.connect();

    if (initiator.toLowerCase() === walletAddress.toLowerCase()) {
      await aliceVideoCall.current.request([peerAddress]);
    }
  };

  // Here we initialize the push video API, which is the first and important step to make video calls
  useEffect(() => {
    if (!signer) return;
    // if (data?.incoming[0]?.status !== VideoCallStatus.UNINITIALIZED) return; // data?.incoming[0]?.status will have a status of VideoCallStatus.UNINITIALIZED when the video call is not initialized, call ended or denied. So we Initialize the Push API here.
    initializePushAPI();
  }, [signer]);

  useEffect(() => {
    console.log("isPushStreamConnected", isPushStreamConnected); // This will be true when the push stream is connected
  }, [isPushStreamConnected]);

  return (
    <div>
      <div>
        {data?.incoming[0]?.status === VideoCallStatus.CONNECTED &&
        data?.incoming[0].stream ? (
          <VideoFrame
            data={data}
            onToggleMic={() => {
              aliceVideoCall.current?.media({audio: !data?.local.audio});
            }}
            onToggleCam={() => {
              aliceVideoCall.current?.media({video: !data?.local.video});
            }}
            onEndCall={async () => {
              await aliceVideoCall.current.disconnect(
                data?.incoming[0]?.address
              );

              onEndCall();
              window.location.reload();
            }}
          />
        ) : (
          <div>
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
};

export default Video;
