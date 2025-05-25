import React from 'react';
//import { assets } from '../assets/assets';
import './About.css';

const About = () => {
  return (
    <div className="about-container">

      <div className="about-heading">
        <p>ABOUT <span className="highlight-text">US</span></p>
      </div>

      <div className="about-content">
        <img className="about-image"  src="/Images/card-image-6.webp" alt="" />

        <div className="about-text">
          <p>
            Welcome to Lushio, your go-to destination for fashion that speaks your style. At Lushio, we believe that clothing is more than just fabric – it’s an expression of personality, confidence, and culture.
          </p>
          <p>
            Our mission is to bring you high-quality, trend-forward pieces that fit every occasion — from casual wear to statement pieces. With a focus on craftsmanship, comfort, and contemporary designs, Trendora is here to elevate your wardrobe effortlessly.
          </p>
          <b className="about-subheading">Our Vision</b>
          <p>
            At Lushio, we envision a world where everyone feels empowered through fashion. We strive to make style accessible, inclusive, and sustainable — helping you define your look while caring for the planet.
          </p>
        </div>
      </div>

      <div className="why-choose-heading">
        <p>WHY <span className="highlight-text-bold">CHOOSE US</span></p>
      </div>

      <div className="why-choose-container">
        <div className="why-box">
          <b>STYLE & QUALITY:</b>
          <p>Carefully curated collections that blend timeless fashion with premium materials.</p>
        </div>

        <div className="why-box">
          <b>EVERYDAY COMFORT:</b>
          <p>Clothing designed to move with you, keeping comfort at the heart of every stitch.</p>
        </div>

        <div className="why-box">
          <b>INCLUSIVE FASHION:</b>
          <p>Sizes and styles for every body type, because style has no limits.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
