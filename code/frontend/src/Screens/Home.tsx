import Navigation from "../components/header";
import CreatePostCard from "../components/createPost";

export default function Home() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1128px] mx-auto px-6 py-6">
          <div className="max-w-[540px] mx-auto">
            <CreatePostCard />
          </div>
        </div>
      </div>
    </>
  );
}
