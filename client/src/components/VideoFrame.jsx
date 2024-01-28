import VideoPlayer from "./VideoPlayer";

import {
  IoMicOffOutline,
  IoMicSharp,
  IoVideocamOffSharp,
  IoVideocamOutline,
} from "react-icons/io5";
import {ImPhoneHangUp} from "react-icons/im";
import {reverseResolveAddress} from "../utils";
import {useEffect, useState} from "react";

export default function VideoFrame({
  data,
  onToggleMic,
  onToggleCam,
  onEndCall,
}) {
  const [callerName, setCallerName] = useState("");
  useEffect(() => {
    const fetchCallerName = async () => {
      const name = await reverseResolveAddress(data?.incoming[0]?.address);

      setCallerName(name);
    };

    fetchCallerName();
  }, [data?.incoming[0]?.address]);
  return (
    <div>
      <div className="w-[90vw] m-auto flex flex-row justify-around gap-2">
        <VideoPlayer whoIs={"You"} stream={data.local.stream} isMuted={true} />

        <VideoPlayer
          whoIs={callerName ?? data?.incoming[0]?.address}
          stream={data.incoming[0].stream}
          isMuted={false}
        />
      </div>
      <div className="flex gap-2 justify-center align-center md:mt-[30px] xl:mt-[20px] mt-[20px] ">
        <button
          className="btn btn-outline btn-info"
          disabled={!data.incoming[0]}
          onClick={onToggleMic}
        >
          {!data.local.audio ? (
            <IoMicOffOutline size={"20px"} />
          ) : (
            <IoMicSharp size={"20px"} />
          )}
        </button>
        <button
          className="btn btn-outline btn-info"
          disabled={!data.incoming[0]}
          onClick={onToggleCam}
        >
          {data.local.video ? (
            <IoVideocamOutline size={"20px"} />
          ) : (
            <IoVideocamOffSharp size={"20px"} />
          )}
        </button>

        <button
          className="btn btn-outline btn-error"
          onClick={onEndCall}
          disabled={!data?.incoming[0]?.address}
        >
          <ImPhoneHangUp size={"20px"} />
        </button>
      </div>
    </div>
  );
}
