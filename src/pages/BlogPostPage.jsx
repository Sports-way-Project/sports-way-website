import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SEO } from "../components/SEO";
import { fetchBlogs } from "../lib/storefrontApi";
import { blogPosts } from "../data/storefrontPages";

export default function BlogPostPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      // Check if it's a static post
      if (id.startsWith("static-")) {
        const index = parseInt(id.split("-")[1], 10);
        if (blogPosts[index]) {
          const bp = blogPosts[index];
          setBlog({
            title: bp.title,
            image: bp.image,
            content: bp.content || bp.excerpt,
            author: bp.author,
            date: new Date(bp.date).toISOString(),
          });
        }
        setLoading(false);
        return;
      }

      // Fetch dynamic post
      try {
        const allBlogs = await fetchBlogs();
        const found = allBlogs.find((b) => b.id === id);
        if (found) {
          setBlog(found);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadPost();
  }, [id]);

  if (loading) {
    return <div className="page-container" style={{ padding: "100px 20px", textAlign: "center" }}>Loading...</div>;
  }

  if (!blog) {
    return (
      <div className="page-container" style={{ padding: "100px 20px", textAlign: "center" }}>
        <h2>Post not found</h2>
        <Link to="/blog" style={{ color: "var(--primary)" }}>Return to Blogs</Link>
      </div>
    );
  }

  const plainTextExcerpt = blog.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 160);

  return (
    <>
      <SEO title={`${blog.title} | Sports Way`} description={plainTextExcerpt} />
      <div className="page-container page-transition" style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 20px" }}>
        <Link to="/blog" style={{ display: "inline-block", marginBottom: "20px", color: "var(--text-muted)", textDecoration: "none" }}>&larr; Back to Blogs</Link>
        <h1 style={{ fontSize: "2.5em", marginBottom: "15px", lineHeight: "1.2" }}>{blog.title}</h1>
        <div style={{ display: "flex", gap: "20px", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "15px", marginBottom: "30px", fontSize: "1em", fontWeight: "500", color: "var(--text-muted)" }}>
          <span>📅 {new Date(blog.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span style={{ color: "var(--red)" }}>✍️ By {blog.author}</span>
        </div>
        
        {blog.image && (
          <img 
            src={blog.image} 
            alt={blog.title} 
            style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "12px", marginBottom: "40px" }} 
          />
        )}
        
        {/^\s*</.test(blog.content) ? (
          <div className="blog-body" dangerouslySetInnerHTML={{ __html: blog.content }} />
        ) : (
          // Legacy plain-text posts (written before the rich text editor) —
          // no HTML tags to render, just preserve the line breaks as typed.
          <div className="blog-body" style={{ whiteSpace: "pre-wrap" }}>{blog.content}</div>
        )}
      </div>
    </>
  );
}
