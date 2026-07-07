// components/IconButton.jsx
export default function SubIconButton({ icon, label, onClick, active }) {
  return (

    <div
      onClick={onClick}
      className={
        `group flex flex-col justify-center items-center h-18 w-19 p-1 rounded-md cursor-pointer shadow-md hover:shadow-md hover:bg-gray-200 transition-all duration-200 ease-in-out ` +
        (active ? "bg-gray-200" : "bg-gray-50")
      }
    >
      <div className="text-xs  text-gray-700 group-hover:scale-110 flex item-center justify-center group-hover:text-gray-800 transition-transform duration-200">
        <img src={icon} alt={label} className="h-8 w-8 object-contain transition-transform group-hover:scale-110" />
      </div>
     
      <div className="mt-1 text-xs text-gray-700 font-thin group-hover:text-gray-800 text-center hover:font-bold">
        {label}
      </div>
    </div>

  );
}
