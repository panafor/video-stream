"use client";
import { IoCloudUploadOutline, IoVideocamOutline } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRef, useState } from "react";

export default function Home() {
  const [video, setVideo] = useState();
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState();
  const [folder, setFolder] = useState("");
  const [folderName, setFolderName] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<any>(null);
  const [type, setType] = useState("download" as any);
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const handleVideos = async (e: any) => {
    console.log("yakhchi baba");
    const file = await e.target.files[0];
    console.log(file);
    setVideo(file);
    setShowVideo(URL.createObjectURL(file) as any);
    console.log(video);
  };

  const onClickVideo = async () => {
    setLoading(true);
    const formData = new FormData();

    formData.append("file", video as any);
    formData.append("name", folder);
    formData.append("type", type);
    formData.append("aspectRatio", aspectRatio);

    fetch("/api/upload", {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      setLoading(false);

      if (data.error) {
        return toast.error("Folder already exists");
      }

      if (type === "download") {
        const downloadLink = document.createElement("a");
        downloadLink.href = `/${data.data}.zip`;
        downloadLink.click();
        toast.success("Zip Downloaded");
      } else {
        toast.success(data);
      }
    });
  };

  return (
    <main className="h-screen flex flex-col items-center justify-center ">
      {/* <div className="flex items-center justify-center gap-10 mb-10">
        <button
          onClick={() => setType("download")}
          className="border p-2 px-6 rounded-lg bg-[#1d1d1d] transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: type === "download" ? "#ededed" : "#1d1d1d",
            color: type === "download" ? "#000" : "#fff",
            transform: type === "download" ? "scale(1.2)" : "scale(1)",
          }}
        >
          ZipDownload
        </button>
        <button
          onClick={() => setType("stream")}
          className="border p-2 px-6 rounded-lg bg-[#1d1d1d] transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: type === "stream" ? "#ededed" : "#1d1d1d",
            color: type === "stream" ? "#1d1d1d" : "#fff",
            transform: type === "stream" ? "scale(1.2)" : "scale(1)",
          }}
        >
          JustStream
        </button>
      </div> */}

      <div className="container bg-[#1d1d1d] max-h-[470px] h-full py-4 p-8 rounded-2xl border border-[#4e4e4e]">
        <div className="border-b justify-between py-2 flex items-center">
          <h3 className="text-4xl">Panafor Video Stream Uploader</h3>
          <span className="loaderSec h-[50px]"></span>
        </div>

        <div className="grid grid-cols-12 pt-8 gap-20 border-b border-b-[#4e4e4e] p-10">
          <div className="col-span-6">
            <p className="text-xl">Please Select Video To Start Uploading</p>
            <div className="flex items-center justify-start gap-10 mt-10">
              <input
                type="text"
                name="folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="Upload Directory Name"
                className="bg-transparent border-b border-[#4e4e4e] text-white w-full outline-none"
              />

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className="border p-2 px-6 rounded-lg bg-[#1d1d1d] transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: aspectRatio === "16:9" ? "#ededed" : "#1d1d1d",
                    color: aspectRatio === "16:9" ? "#000" : "#fff",
                  }}
                >
                  16:9
                </button>
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className="border p-2 px-6 rounded-lg bg-[#1d1d1d] transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: aspectRatio === "9:16" ? "#ededed" : "#1d1d1d",
                    color: aspectRatio === "9:16" ? "#000" : "#fff",
                  }}
                >
                  9:16
                </button>
              </div>

              <input name="file" type="file" onChange={handleVideos} ref={inputRef} hidden />
              <button
                className="bg-[#ededed] text-sm text-black w-[300px] h-[48px] flex items-center gap-3 justify-center rounded-lg font-bold cursor-pointer hover:bg-[#e7e7e7d8] hover:text-black transition-all duration-200"
                onClick={() => inputRef.current.click()}
                disabled={!folder}
              >
                Select Video
                <IoVideocamOutline className="text-xl" />
              </button>
            </div>
          </div>

          <div className="col-span-6">
            <div>
              {showVideo ? (
                <video className="w-full h-[200px] object-cover" controls>
                  <source src={showVideo}></source>
                </video>
              ) : (
                <p>Please Select a Video to Preview...</p>
              )}
            </div>

            <input
              name="file"
              type="file"
              onChange={(e) => handleVideos(e)}
              ref={inputRef}
              hidden
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="loader"></span>
            <p>Uploading...</p>
          </div>
        ) : (
          <button
            className="flex items-center justify-center gap-3 mx-auto mt-10 bg-[#ededed] text-black w-52 h-[48px] rounded-lg font-bold cursor-pointer hover:bg-[#e7e7e7d8] hover:text-black transition-all duration-200"
            disabled={!folder || !video || loading}
            onClick={() => onClickVideo()}
          >
            Upload Video
            <IoCloudUploadOutline className="text-xl" />
          </button>
        )}
      </div>

      <ToastContainer position="bottom-left" theme="dark" />
    </main>
  );
}
