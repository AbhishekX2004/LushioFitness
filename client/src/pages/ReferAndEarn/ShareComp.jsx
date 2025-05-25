import React from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
} from 'react-share';

const ShareComponent = ({referralCode}) => {
  const shareUrl = `${process.env.REACT_APP_FRONTEND_URL}/login?${referralCode}`;  // URL to share
 
  const text = "Hey, check this out! Sign up using my referral codeand earn ₹100 rewards. Don't miss this amazing opportunity!"; // Refer and earn text


  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {/* Facebook Share Button */}
      <FacebookShareButton url={shareUrl} quote={text}>
        <FacebookIcon size={32} round />
      </FacebookShareButton>

      {/* Twitter Share Button */}
      <TwitterShareButton url={shareUrl} title={text}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>

      {/* WhatsApp Share Button */}
      <WhatsappShareButton url={shareUrl} title={text}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>

      {/* Gmail/Email Share Button */}
      <EmailShareButton url={shareUrl} subject="Check this out!" body={text}>
        <EmailIcon size={32} round />
      </EmailShareButton>
    </div>
  );
};

export default ShareComponent;
