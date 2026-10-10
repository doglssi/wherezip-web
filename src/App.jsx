import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const initialData = [
  {
    id: 1,
    dong: "관악구 신림동",
    subway: "신림역 (2호선)",
    score: 94,
    timeNum: 28,
    time: "28분 (직통)",
    priceNum: 55,
    price: "55만 원",
    density: "매우 높음",
    lat: 37.4842,
    lng: 126.9297,
    chartData: [
      { subject: '교통 소요시간', A: 90 },
      { subject: '전월세 시세', A: 85 },
      { subject: '편의시설', A: 95 },
      { subject: '안전/치안', A: 80 },
      { subject: '단지/주거환경', A: 75 },
    ]
  },
  {
    id: 2,
    dong: "관악구 봉천동",
    subway: "서울대입구역 (2호선)",
    score: 88,
    timeNum: 22,
    time: "22분 (직통)",
    priceNum: 62,
    price: "62만 원",
    density: "높음",
    lat: 37.4812,
    lng: 126.9527,
    chartData: [
      { subject: '교통 소요시간', A: 95 },
      { subject: '전월세 시세', A: 75 },
      { subject: '편의시설', A: 85 },
      { subject: '안전/치안', A: 85 },
      { subject: '단지/주거환경', A: 80 },
    ]
  },
  {
    id: 3,
    dong: "동작구 사당동",
    subway: "사당역 (2/4호선)",
    score: 83,
    timeNum: 16,
    time: "16분 (직통)",
    priceNum: 68,
    price: "68만 원",
    density: "보통",
    lat: 37.4765,
    lng: 126.9816,
    chartData: [
      { subject: '교통 소요시간', A: 100 },
      { subject: '전월세 시세', A: 65 },
      { subject: '편의시설', A: 80 },
      { subject: '안전/치안', A: 80 },
      { subject: '단지/주거환경', A: 85 },
    ]
  }
];

export default function App() {
  const [sortType, setSortType] = useState('score');
  const [selectedItem, setSelectedItem] = useState(initialData[0]);
  
  // 지도 필터 상태 관리
  const [activeFilter, setActiveFilter] = useState('CS2');
  const [facilityCount, setFacilityCount] = useState(0);

  // SVG 커스텀 마커 핀 생성 함수
  const createCustomMarkerImage = (color, emoji) => {
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
        <path d="M18 0C8.058 0 0 8.058 0 18c0 13.5 18 24 18 24s18-10.5 18-24C36 8.058 27.942 0 18 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="18" cy="17" r="11" fill="#ffffff"/>
        <text x="18" y="21" font-size="12" text-anchor="middle">${emoji}</text>
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  };

  // 카카오 지도 렌더링 및 주변 시설 검색
  useEffect(() => {
    const kakao = window.kakao;
    if (kakao && kakao.maps) {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        if (!container) return;

        const options = {
          center: new kakao.maps.LatLng(selectedItem.lat, selectedItem.lng),
          level: 4
        };
        const map = new kakao.maps.Map(container, options);

        // 메인 위치 마커 (보라색 핀)
        const centerPosition = new kakao.maps.LatLng(selectedItem.lat, selectedItem.lng);
        const mainMarkerImage = new kakao.maps.MarkerImage(
          createCustomMarkerImage('#6366f1', '📍'),
          new kakao.maps.Size(36, 42),
          { offset: new kakao.maps.Point(18, 42) }
        );

        const mainMarker = new kakao.maps.Marker({
          position: centerPosition,
          image: mainMarkerImage
        });
        mainMarker.setMap(map);

        // 메인 위치 인포윈도우
        const infowindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;font-weight:bold;color:#1e293b;border-radius:8px;">${selectedItem.dong}</div>`
        });
        infowindow.open(map, mainMarker);

        // 카카오 장소 검색 서비스
        const ps = new kakao.maps.services.Places(map);

        let filterConfig = null;
        if (activeFilter === 'CS2') {
          filterConfig = { color: '#10b981', emoji: '🏪', type: 'category', query: 'CS2' };
        } else if (activeFilter === 'POLICE') {
          filterConfig = { color: '#f59e0b', emoji: '🚔', type: 'keyword', query: '경찰서' };
        } else if (activeFilter === 'PHARMACY') {
          filterConfig = { color: '#ef4444', emoji: '💊', type: 'category', query: 'PM9' };
        } else if (activeFilter === 'LAUNDRY') {
          filterConfig = { color: '#06b6d4', emoji: '🧺', type: 'keyword', query: '코인빨래방' };
        }

        if (filterConfig) {
          const markerImg = new kakao.maps.MarkerImage(
            createCustomMarkerImage(filterConfig.color, filterConfig.emoji),
            new kakao.maps.Size(32, 38),
            { offset: new kakao.maps.Point(16, 38) }
          );

          const handleSearchResults = (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
              setFacilityCount(data.length);
              data.forEach(place => {
                new kakao.maps.Marker({
                  map: map,
                  position: new kakao.maps.LatLng(place.y, place.x),
                  image: markerImg
                });
              });
            } else {
              setFacilityCount(0);
            }
          };

          if (filterConfig.type === 'category') {
            ps.categorySearch(filterConfig.query, handleSearchResults, { location: centerPosition, radius: 1000 });
          } else {
            ps.keywordSearch(filterConfig.query, handleSearchResults, { location: centerPosition, radius: 1200 });
          }
        } else {
          setFacilityCount(0);
        }
      });
    }
  }, [selectedItem, activeFilter]);

  const getSortedData = () => {
    const sorted = [...initialData];
    if (sortType === 'score') return sorted.sort((a, b) => b.score - a.score);
    if (sortType === 'time') return sorted.sort((a, b) => a.timeNum - b.timeNum);
    if (sortType === 'price') return sorted.sort((a, b) => a.priceNum - b.priceNum);
    return sorted;
  };

  const sortedData = getSortedData();

  const handleSortChange = (type) => {
    setSortType(type);
    const newSorted = [...initialData].sort((a, b) => {
      if (type === 'score') return b.score - a.score;
      if (type === 'time') return a.timeNum - b.timeNum;
      if (type === 'price') return a.priceNum - b.priceNum;
      return 0;
    });
    setSelectedItem(newSorted[0]);
  };

  return (
    <div style={{ padding: '32px 24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 헤더 & 정렬 필터 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: 'bold' }}>
            추천 완료
          </span>
          <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '14px' }}>도착지: 강남역 기준</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px', marginBottom: 0, color: '#0f172a' }}>
            민수님에게 가장 잘 맞는 자취 동네 TOP 3
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>정렬:</span>
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <button
              onClick={() => handleSortChange('score')}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: sortType === 'score' ? '#4f46e5' : '#ffffff',
                color: sortType === 'score' ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              종합 점수순
            </button>
            <button
              onClick={() => handleSortChange('time')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderLeft: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
                backgroundColor: sortType === 'time' ? '#4f46e5' : '#ffffff',
                color: sortType === 'time' ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              통근시간순
            </button>
            <button
              onClick={() => handleSortChange('price')}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: sortType === 'price' ? '#4f46e5' : '#ffffff',
                color: sortType === 'price' ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              월세순
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 카드 영역 */}
      <div style={{ display: 'flex', gap: '18px', marginBottom: '28px', marginTop: '12px' }}>
        {sortedData.map((item, index) => {
          const isSelected = selectedItem.id === item.id;
          const isFirstPlace = index === 0;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              style={{
                flex: 1,
                padding: '24px 20px 20px 20px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: isSelected ? '2.5px solid #6366f1' : '1px solid #e2e8f0',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 10px 20px -3px rgba(99, 102, 241, 0.2)' : 'none',
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isFirstPlace ? (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '16px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  zIndex: 10
                }}>
                  <span>👑</span> 1위 최적 추천
                </div>
              ) : (
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: isSelected ? '#6366f1' : '#64748b', marginBottom: '8px' }}>
                  {index + 1}위 추천
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: isFirstPlace ? '4px' : '0' }}>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>{item.dong}</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>{item.subway}</p>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bolder', color: '#4f46e5' }}>
                  {item.score} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>/100</span>
                </div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '14px 0' }} />
              
              <div style={{ fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>직주근접 소요시간</span>
                <strong style={{ color: '#0f172a' }}>{item.time}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>평균 월세 시세</span>
                <strong style={{ color: '#10b981' }}>{item.price}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>편의 인프라 밀도</span>
                <strong style={{ color: '#4f46e5' }}>{item.density}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 리포트 & 지도 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 좌측: 레이더 차트 (속이 꽉 찬 보라색 원 dot 적용) */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{selectedItem.dong.split(' ')[1]} 지표 종합 리포트</h3>
            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
              종합 {selectedItem.score}점
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0' }}>입력하신 가중치 지표에 맞춘 동네 세부 점수입니다.</p>
          
          <div style={{ width: '100%', height: '280px', minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedItem.chartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 13, fontWeight: 'bold', fill: '#334155' }} 
                />
                <Radar 
                  name="점수" 
                  dataKey="A" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5}
                  fill="#818cf8" 
                  fillOpacity={0.35} 
                  // dot 내부 채우기를 위해 fillOpacity를 무시하도록 force 처리
                  dot={{ r: 5, fill: '#4f46e5', stroke: '#4f46e5', fillOpacity: 1 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 우측: 카카오 지도 + 한 줄 정렬 필터 */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>주변 편의 인프라 맵</h3>
              <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '8px', fontSize: '12px' }}>
                카카오 지도 API 연동
              </span>
            </div>

            {/* 실제 지도 DOM 영역 */}
            <div 
              id="map" 
              style={{ 
                width: '100%', 
                height: '240px', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                border: '1px solid #cbd5e1',
                backgroundColor: '#f1f5f9' 
              }}
            />
          </div>

          {/* 한 줄 필터 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', flexWrap: 'nowrap', overflowX: 'auto' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>필터:</span>
            
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
              {/* 1. 편의점 */}
              <button
                onClick={() => setActiveFilter(activeFilter === 'CS2' ? 'NONE' : 'CS2')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '20px',
                  border: activeFilter === 'CS2' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  backgroundColor: activeFilter === 'CS2' ? '#ecfdf5' : '#ffffff',
                  color: activeFilter === 'CS2' ? '#047857' : '#64748b',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                🏪 편의점 {activeFilter === 'CS2' && `(${facilityCount})`}
              </button>

              {/* 2. 경찰서/CCTV */}
              <button
                onClick={() => setActiveFilter(activeFilter === 'POLICE' ? 'NONE' : 'POLICE')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '20px',
                  border: activeFilter === 'POLICE' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                  backgroundColor: activeFilter === 'POLICE' ? '#fffbeb' : '#ffffff',
                  color: activeFilter === 'POLICE' ? '#b45309' : '#64748b',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                🚔 경찰서/CCTV {activeFilter === 'POLICE' && `(${facilityCount})`}
              </button>

              {/* 3. 24시 약국 */}
              <button
                onClick={() => setActiveFilter(activeFilter === 'PHARMACY' ? 'NONE' : 'PHARMACY')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '20px',
                  border: activeFilter === 'PHARMACY' ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                  backgroundColor: activeFilter === 'PHARMACY' ? '#fef2f2' : '#ffffff',
                  color: activeFilter === 'PHARMACY' ? '#b91c1c' : '#64748b',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                💊 24시 약국 {activeFilter === 'PHARMACY' && `(${facilityCount})`}
              </button>

              {/* 4. 코인빨래방 */}
              <button
                onClick={() => setActiveFilter(activeFilter === 'LAUNDRY' ? 'NONE' : 'LAUNDRY')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '20px',
                  border: activeFilter === 'LAUNDRY' ? '1.5px solid #06b6d4' : '1px solid #e2e8f0',
                  backgroundColor: activeFilter === 'LAUNDRY' ? '#ecfeff' : '#ffffff',
                  color: activeFilter === 'LAUNDRY' ? '#0e7490' : '#64748b',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                🧺 코인빨래방 {activeFilter === 'LAUNDRY' && `(${facilityCount})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}