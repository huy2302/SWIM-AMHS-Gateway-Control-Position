import LoginCard from "@/components/LoginCard";
import background from "@/assets/background.png";
import vatmLogo from "@/assets/vatm-logo.png";
import attechLogo from "@/assets/attech-logo.png";

export default function LoginPage() {
    return (
        <div className="relative flex h-screen overflow-hidden bg-[#EEF3F8]">
            <img
                src={background}
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r 
                from-white/80 
                via-[#f0f6fb]/20 
                via-[#dcecff]/5 
                via-[#f0f6fb]/20 
                to-white/80" 
            />
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,.02),transparent_40%)]" />
            
            {/* LEFT */}
            <div className="relative flex w-[56%] flex-col overflow-hidden">

                <div className="relative z-20 flex h-full flex-col px-20 py-16">
                    <div className="flex items-center gap-8">
                        <img
                            src={vatmLogo}
                            className="h-28 drop-shadow-xl"
                        />
                        <img
                            src={attechLogo}
                            className="h-16 drop-shadow-lg"
                        />
                    </div>

                    <div className="mt-16">
                        <h1 className="text-6xl font-bold tracking-wide text-[#123E82]">
                            AMHS SWIM GATEWAY
                        </h1>

                        <p className="max-w-xl text-3xl font-light text-[#204a7d]">
                            Hệ thống giám sát & quản lý kết nối
                            AMHS qua SWIM
                        </p>

                        <div className="my-6 h-0.5 w-28 rounded bg-blue-600/50" />
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[FFFFFF0]">
                <LoginCard />
            </div>
        </div>
    );
}