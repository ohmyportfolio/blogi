export const Footer = () => {
    return (
        <footer className="relative overflow-hidden bg-[#0b1320] text-white py-10 border-t border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(700px_420px_at_90%_0%,rgba(14,165,166,0.2),transparent_60%)]" />
            <div className="container mx-auto px-4 text-center relative">
                <h3 className="font-display text-2xl mb-3">다낭VIP투어</h3>
                <p className="text-sm text-white/70 mb-4 tracking-wide">
                    KAKAOTALK & TELEGRAM: DANANGVIP
                </p>
                <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
                    Copyright © Danang VIP Tour. All rights reserved.
                </p>
            </div>
        </footer>
    );
};
