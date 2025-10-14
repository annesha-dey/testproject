import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have shop parameter in URL (after OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    
    if (shop) {
      // Redirect to home page with shop parameter
      navigate(`/home?shop=${shop}`);
    } else {
      // No shop parameter, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // This component should never render anything as it immediately redirects
  return null;
}
