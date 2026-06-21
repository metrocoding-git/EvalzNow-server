import Image from 'next/image';
const loadingImg = "/images/loading-image.jpg";
// import loadingIcon from '../../public/icons/loading-icon.png';
const loadingIcon = "/icons/loading-icon.png";
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Full width image */}
      <div className="w-full h-[60vh] relative">
        <Image 
          src={loadingImg}
          alt="Loading background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Main heading */}
      <div className="px-8 py-8 ">
        <h1 className="text-4xl font-bold text-gray-800">Altair<span className='text-2xl'><sup>®</sup></span> HyperMesh<span className='text-2xl'><sup>®</sup></span></h1>
      </div>

      {/* Footer section */}
      <div className="px-4 py-6 mt-auto">
        <div className="flex justify-between items-end px-4">
          <div className="text-sm text-gray-600">
            <p className='text-2xl font-bold'>2024</p>
            <p>Copyright © 2024 Altair Engineering Inc. All Rights Reserved</p>
            <p>Loading HyperWorksDesktop.</p>
          </div>

          <div className="flex items-center mb-4">
            <div className="relative bottom-1">
              <Image 
                src={loadingIcon}
                alt="Altair icon"
                width={45}
                height={45}
                priority
              />
            </div>
            <div className="">
              <p className="font-semibold text-lg text-blue-800">ALTAIR</p>
              <p className="text-[8px] font-semibold text-blue-300">ONLY FORWARD</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}