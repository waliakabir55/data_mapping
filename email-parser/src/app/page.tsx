import EmailForm from '@/components/EmailForm';

// This is the main page of the application.
// It renders the EmailForm React component. This component is responsible for rendering the UI for the home page. You can include any JSX elements, components, or logic needed to display the content of the home page.
// Server-Side Rendering (SSR): Next.js supports server-side rendering, meaning that the content of this page can be generated on the server before being sent to the client. This can improve performance and SEO since the initial HTML is fully rendered when the page loads.
// If you use static generation (with getStaticProps or getStaticPaths), the content can be pre-rendered at build time, allowing for faster page loads.


export default function Home() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-8">Email Parser</h1>
            <EmailForm />
        </main>
    );
}