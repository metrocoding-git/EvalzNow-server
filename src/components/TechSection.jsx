import Image from "next/image";
import loginImg from "../../public/icons/login.png"; // correct path alias

export default function TextSection() {
  return (
    <div className="flex-1 bg-gradient-to-br from-red-900 to-blue-900 text-white flex items-center justify-center p-12">
      <div className=" text-justify">
        {/* <h1 className="text-6xl text-center font-bold mb-8">EVZ</h1> */}
        <Image
          src={loginImg}
          alt="Login illustration"
          width={160}
          height={160}
          className="mx-auto mb-6 "
          priority
        />
                <p className="text-2xl">
          EvalzNow, which is derived from cognitive science, educational
          psychology, and complex mathematical modelling, is the first human
          capital assessment tool that calculates proficiency scores, growth
          indices, and hybrid metrics at the candidate level and the unit level.
          Additionally, this tool facilitates educational accounting, so users
          can incorporate real-life observations, show compliance with
          individualized educational programs, and can assess any performance
          metrics over time. Such abilities, when combined with various data
          reporting and data extraction schemes, arm companies with an
          invaluable means to manage classrooms, large enterprises, training
          events, and projects at all levels.
        </p>
      </div>
    </div>
  );
}
