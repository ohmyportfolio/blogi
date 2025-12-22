const AuthLayout = ({
    children
}: {
    children: React.ReactNode
}) => {
    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-[radial-gradient(800px_500px_at_20%_0%,rgba(14,165,166,0.2),transparent_60%),radial-gradient(700px_420px_at_85%_10%,rgba(255,107,87,0.2),transparent_60%)] py-8 px-4">
            {children}
        </div>
    );
}

export default AuthLayout;
