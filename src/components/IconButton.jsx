import Link from "next/link";

export default function IconButton({ icon, label, onClick, active, link }) {
  return (

    <Link href={link || '#'}
      onClick={onClick}
      className={
        `group flex flex-col justify-center items-center h-18 w-19 p-5 mx-1 rounded-md cursor-pointer shadow-md hover:shadow-md hover:bg-gray-200 transition-all duration-200 ease-in-out ` +
        (active ? "bg-gray-300" : "bg-gray-100")
      }
    >
      <div className="mb-1">
        <img
          src={icon}
          alt={label}
          className="h-8 w-8 object-contain transition-transform group-hover:scale-105 pt-1"
        />
      </div>
      <div className="text-xs text-gray-700 group-hover:text-gray-800 text-center hover:font-bold">
        {label}
      </div>
    </Link>
  );
}
