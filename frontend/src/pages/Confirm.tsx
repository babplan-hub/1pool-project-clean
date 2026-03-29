import { useNavigate } from "react-router-dom";

const Confirm = ({ totalAmount }: any) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
      <div className="bg-white/5 border border-white/10 p-10 rounded-2xl text-center">
        <h2 className="text-2xl mb-6">
          Scan to Pay
        </h2>

        <div className="bg-white p-6 rounded-xl mb-6">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=1POOL-${totalAmount}`}
          />
        </div>

        <p className="text-blue-400 text-xl mb-6">
          ฿{totalAmount}
        </p>

        <button
          onClick={() => navigate("/success")}
          className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default Confirm;