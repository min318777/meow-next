const Banner = () => {
  return (
    <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg mx-4 my-6 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              우리 고양이를 자랑해주세요! 🐱
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              귀여운 고양이들의 일상을 공유하고 소통해보세요
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
              글 쓰러가기 ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Banner;
