import React from "react";
import Media from "./data";
import Carousel from "./Carousel";
import CollectionCard from "./CollectionCard";
import useCarouselBanners from "../../components/useCarouselBanners";
import FeaturedProducts from "./FeaturedProducts";
import HomeWishlist from "./HomeWishList";
export default function Home() {
   const { banners } = useCarouselBanners();
  return (
    <>
      {/* <Carousel images={Media} /> */}
        <Carousel images={banners} />
      {/* <ProductCards /> */}
      <HomeWishlist/>
      <FeaturedProducts/>
      {/* <div className="collection-card-container">
        <CollectionCard
          image="/Images/card-image-6.png"
          name="SHIRTS"
        />
        <CollectionCard
          image="/Images/card-image-7.png"
          name="BEST SELLERS"
        />
        <CollectionCard
          image="/Images/card-image-5.png"
          name="SALE"
        />
      </div> */}
      <br></br>
    </>
  );
}
