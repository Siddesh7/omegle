import {useEffect, useRef} from "react";
import {isEthereumAddress, truncateAddress} from "../utils";
import {useParams} from "react-router-dom";

export default function VideoPlayer({stream, isMuted, whoIs}) {
  const videoRef = useRef(null);
  const {uri} = useParams();
  console.log("uriiii", uri);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [videoRef, stream]);

  return (
    <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden">
      <p className="absolute bottom-[10px] left-[20px] z-[100] p-4 badge badge-xs font-xs">
        {whoIs === "You"
          ? whoIs
          : isEthereumAddress(whoIs)
          ? truncateAddress(whoIs)
          : whoIs}
      </p>

      <video
        className="absolute z-[10] top-0 left-0 w-full rounded-xl"
        ref={videoRef}
        muted={isMuted}
        autoPlay
      />
    </div>
  );
}
