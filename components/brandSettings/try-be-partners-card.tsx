"use client";

const TrybePartnersCard = () => {
  return (
    <div className="w-full rounded-[28px] border border-slate-200 bg-white">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Trybe Partners
        </h2>

        {/* Button + Tooltip */}
        <div className="relative group">
          <button className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 text-white text-sm opacity-70 cursor-not-allowed">
            + Add Partner
          </button>

          {/* Tooltip */}
          <div className="absolute right-0 -top-16 hidden group-hover:block">
            <div className="bg-black text-white text-xs px-3 py-1 rounded-md shadow">
              Partner marketplace coming soon
            </div>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        
        {/* Icon circle */}
        <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="currentColor" className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400"><path d="M22 6.75003H19.2111C18.61 6.75003 18.3094 6.75003 18.026 6.66421C17.7426 6.5784 17.4925 6.41168 16.9923 6.07823C16.2421 5.57806 15.3862 5.00748 14.961 4.87875C14.5359 4.75003 14.085 4.75003 13.1833 4.75003C11.9571 4.75003 11.1667 4.75003 10.6154 4.97839C10.0641 5.20675 9.63056 5.6403 8.76347 6.50739L8.00039 7.27047C7.80498 7.46588 7.70727 7.56359 7.64695 7.66005C7.42335 8.01764 7.44813 8.47708 7.70889 8.80854C7.77924 8.89796 7.88689 8.98459 8.10218 9.15785C8.89796 9.79827 10.0452 9.73435 10.7658 9.00945L12 7.76789H13L19 13.8036C19.5523 14.3592 19.5523 15.2599 19 15.8155C18.4477 16.3711 17.5523 16.3711 17 15.8155L16.5 15.3125M13.5 12.2947L16.5 15.3125M16.5 15.3125C17.0523 15.8681 17.0523 16.7689 16.5 17.3244C15.9477 17.88 15.0523 17.88 14.5 17.3244L13.5 16.3185M13.5 16.3185C14.0523 16.874 14.0523 17.7748 13.5 18.3304C12.9477 18.8859 12.0523 18.8859 11.5 18.3304L10 16.8214M13.5 16.3185L11.5 14.3185M9.5 16.3185L10 16.8214M10 16.8214C10.5523 17.377 10.5523 18.2778 10 18.8334C9.44772 19.3889 8.55229 19.3889 8 18.8334L5.17637 15.9509C4.59615 15.3586 4.30604 15.0625 3.93435 14.9062C3.56266 14.75 3.14808 14.75 2.31894 14.75H2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M22 14.75H19.5" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path><path d="M8.5 6.75003L2 6.75003" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path></svg>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          There are no partners available yet.
        </p>
      </div>
    </div>
  );
};

export default TrybePartnersCard;