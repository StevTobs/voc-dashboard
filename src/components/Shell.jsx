import React from 'react';

export const navigation = [
  { path: '/overview', label: 'ภาพรวมด้านบริการ' },
  { path: '/complaint-detail', label: 'ประเภทเสียงร้องเรียน' },
];

export default function Shell({ path, children }) {
  return <>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main').focus(); }}>ข้ามไปยังเนื้อหา</a>
    <header className="header"><div className="header-inner">
      <a className="brand" href="#/overview" aria-label="PEA VOC Dashboard หน้าภาพรวม">
        <img className="pea-logo" src={`${import.meta.env.BASE_URL}images/pea-logo.png`} alt="PEA การไฟฟ้าส่วนภูมิภาค" width="1362" height="566" />
        <span className="product-name">VOC Dashboard</span>
      </a>
      <nav className="navigation" aria-label="เมนูหลัก">{navigation.map(item => <a key={item.path} href={`#${item.path}`} aria-current={path === item.path ? 'page' : undefined}>{item.label}</a>)}</nav>
      <div className="user-area"><span className="avatar" aria-hidden="true">P</span><span>ผู้ใช้งานทั่วไป</span></div>
    </div></header>
    <main id="main" className={path === '/complaint-detail' ? 'complaint-detail-page' : undefined} tabIndex="-1">{children}</main>
    <footer>PEA VOC Dashboard <span className="credit">Created by แผนกวิเคราะห์สารสนเทศและพฤติกรรมลูกค้า กสล. โทร 02-009-6735</span></footer>
  </>;
}
