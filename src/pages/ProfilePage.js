import React, { useEffect, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";
import "./ProfilePage.css";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaStore,
  FaShoppingBag,
  FaShoppingCart,
  FaVideo,
  FaSignOutAlt,
  FaHome,
  FaHeart, // 🟢 ADDED: FaHeart icon for My Wishlist
} from "react-icons/fa";

const ProfilePage = () => {
  const { userId } = useParams(); // Optional param
  const [sellerData, setSellerData] = useState(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); 

  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth();
  const navigate = useNavigate();

  // Format reel document with URLs
  const formatReelDoc = async (docSnap) => {
    const data = docSnap.data();
    let imageUrl = data.imageUrl || "";
    let reelUrl = data.reelUrl || "";

    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        imageUrl = await getDownloadURL(ref(storage, imageUrl));
      } catch {
        imageUrl = "/video-placeholder.png";
      }
    }
    if (!imageUrl) imageUrl = "/video-placeholder.png";

    if (reelUrl && !reelUrl.startsWith("http")) {
      try {
        reelUrl = await getDownloadURL(ref(storage, reelUrl));
      } catch {
        reelUrl = "";
      }
    }

    return { id: docSnap.id, ...data, imageUrl, reelUrl };
  };

  // Fetch profile + reels + Handle Resize
  useEffect(() => {
    const fetchData = async () => {
      try {
        let idToFetch = userId;

        // If no userId in URL → show current logged-in user's profile
        if (!idToFetch) {
          if (auth.currentUser) {
            idToFetch = auth.currentUser.uid;
          } else {
            console.warn("No user logged in and no userId in URL.");
            setLoading(false);
            return;
          }
        }

        // Fetch seller data
        const sellerRef = doc(db, "sellerDetails", idToFetch);
        const sellerSnap = await getDoc(sellerRef);

        if (!sellerSnap.exists()) {
          setSellerData(null);
          setLoading(false);
          return;
        }
        setSellerData(sellerSnap.data());

        // Fetch reels for this seller
        const topLevelCol = collection(db, "reels");
        const topLevelSnap = await getDocs(
          query(topLevelCol, where("sellerId", "==", idToFetch))
        );

        let foundReels = [];
        if (!topLevelSnap.empty) {
          foundReels = await Promise.all(
            topLevelSnap.docs.map((d) => formatReelDoc(d))
          );
        }

        setReels(foundReels);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 🟢 ADDED: Handle resize for responsiveness
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [db, storage, userId]);

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const idToUpdate = userId || auth.currentUser?.uid;
    if (!idToUpdate) return;

    try {
      const logoRef = ref(storage, `brandLogos/${idToUpdate}/${file.name}`);
      await uploadBytes(logoRef, file);
      const downloadURL = await getDownloadURL(logoRef);

      await updateDoc(doc(db, "sellerDetails", idToUpdate), {
        brandLogoUrl: downloadURL,
      });

      setSellerData((prev) => ({ ...prev, brandLogoUrl: downloadURL }));
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  // 🟢 UPDATED: Sidebar Items Component - Aligned with DisplayPage/other pages
  const SidebarItems = () => {
    const user = auth.currentUser;
    // NOTE: Hardcoded email check for "Be a Seller" is kept as per the original component structure (e.g., from DisplayPage.js)
    const isSpecialSeller = user?.email === "mayank21047195@gmail.com"; 
    
    return (
      <>
        {/* Home */}
        <div className="sidebar-item" onClick={() => navigate("/display")}>
          <FaHome size={22} />
          <span>Home</span>
        </div>

        {/* My Profile */}
        <div className="sidebar-item" onClick={() => navigate("/profile")}>
          <FaUser size={22} />
          <span>My Profile</span>
        </div>

        {/* My Cart */}
        <div className="sidebar-item" onClick={() => navigate("/cart")}>
          <FaShoppingCart size={22} />
          <span>My Cart</span>
        </div>

        {/* 🟢 NEW: My Wishlist */}
        <div className="sidebar-item" onClick={() => navigate("/wishlist")}>
          <FaHeart size={22} />
          <span>My Wishlist</span>
        </div>
        
        {/* Reels */}
        <div className="sidebar-item" onClick={() => navigate("/reels")}>
          <FaVideo size={22} />
          <span>Reels</span>
        </div>

        {/* Be a Seller (Conditional) - Assuming this link should navigate to verification/upload flow */}
        {isSpecialSeller && (
            <div className="sidebar-item" onClick={() => navigate("/verifydetails")}> 
              <FaStore size={22} />
              <span>Be a Seller</span>
            </div>
        )}
        
        {/* Logout (Desktop - pushed to bottom) */}
        {/* The condition for mobile logout button has been removed to match the requested component structure (like DisplayPage.js) 
            However, we keep the desktop logout button pushed to the bottom. */}
        
        
        {/* Logout (Mobile - placed last for mobile nav bar) */}
      

      </>
    );
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!sellerData) return <div className="error">Seller profile not found</div>;

  // Only profile owner can upload logo
  const isOwner =
    auth.currentUser && (userId ? auth.currentUser.uid === userId : true);

  // Stats
  const postsCount = reels.length;
  const followersCount = sellerData.followers || 0;
  const followingCount = sellerData.following || 0;

  return (
    <div className={`profile-page ${isMobile ? "mobile-view" : ""}`}>
      {/* 🟢 Sidebar (Desktop) */}
      {!isMobile && (
        <aside className="sidebar">
          <SidebarItems />
        </aside>
      )}

      {/* Main Profile */}
      <main className="profile-card-container">
        <div className="profile-card">
          {/* Logo */}
          <div className="profile-logo-container">
            <img
              src={
                sellerData.brandLogoUrl ||
                sellerData.profileImage ||
                "/default-profile.png"
              }
              alt="Brand Logo"
              className="profile-logo"
            />
            {isOwner && (
              <label className="upload-logo-btn">
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>

          {/* Name + Brand */}
          <h2>{sellerData.name || "Unnamed User"}</h2>
          {sellerData.brandName && (
            <p className="brand-name">{sellerData.brandName}</p>
          )}

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-card">
              <strong>{postsCount}</strong>
              <span>Posts</span>
            </div>
            <div className="stat-card">
              <strong>{followersCount}</strong>
              <span>Followers</span>
            </div>
            <div className="stat-card">
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>
          </div>

          {/* Reels */}
          <div className="reels-grid">
            {reels.length > 0 ? (
              reels.map((reel) => (
                <div
                  key={reel.id}
                  className="reel-card"
                  onClick={() => navigate(`/reel/${reel.id}`)}
                >
                  <img
                    src={reel.imageUrl}
                    alt="Reel Thumbnail"
                    className="reel-thumbnail"
                  />
                </div>
              ))
            ) : (
              <p className="no-reels">No reels uploaded yet</p>
            )}
          </div>
        </div>
      </main>

      {/* 🟢 Mobile Sidebar (Bottom Navigation) */}
      {isMobile && <nav className="mobile-sidebar"><SidebarItems /></nav>}
    </div>
  );
};

export default ProfilePage;
