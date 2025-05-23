import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as XLSX from 'xlsx';
import "./SDashboard.css";

const API_URL = 'http://localhost:8081';

const SDashboard = () => {
  const [selectedBrgy, setSelectedBrgy] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [acceptedUsers, setAcceptedUsers] = useState([]);
  const [monthlyPopulation, setMonthlyPopulation] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartsRef = useRef([]);
  const [beneficiariesData, setBeneficiariesData] = useState({
    beneficiaries: 0,
    nonBeneficiaries: 0
  });
  const [applicationStatusData, setApplicationStatusData] = useState({
    declined: 0,
    pending: 0,
    accepted: 0
  });
  const [familyAgeData, setFamilyAgeData] = useState({
    ageGroups: {
      'Under 18': 0,
      '18-30': 0,
      '31-45': 0,
      '46-60': 0,
      'Over 60': 0
    },
    rawData: []
  });
  const [ageData, setAgeData] = useState({
    highestAge: 0,
    lowestAge: 0,
    ageDistribution: []
  });
  
  const [childrenCountData, setChildrenCountData] = useState({
    childrenCountDistribution: []
  });
  
  // Add state for children age data
  const [childrenAgeData, setChildrenAgeData] = useState({
    ageGroups: {
      '0-5': 0,
      '6-12': 0,
      '13-17': 0,
      '18-21': 0,
      '22+': 0
    },
    rawData: []
  });
  
  // Add date validation function
  const validateDates = (start, end) => {
    // Clear previous error
    setDateError("");

    // Get current year
    const currentYear = new Date().getFullYear();

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Check if either date's year is in the future
      if (startDate.getFullYear() > currentYear || endDate.getFullYear() > currentYear) {
        setDateError("Cannot select future years");
        return false;
      }

      // Check if end date is before start date
      if (endDate < startDate) {
        setDateError("End date cannot be earlier than start date");
        return false;
      }
    }
    return true;
  };

  // Update the date change handlers
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (validateDates(newStartDate, endDate)) {
      setStartDate(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (validateDates(startDate, newEndDate)) {
      setEndDate(newEndDate);
    }
  };

  // Function to get max date allowed (last day of current year)
  const getMaxDateForInput = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-12-31`;
  };

  const barangays = [
    "All",
    "Adia",
    "Bagong Pook",
    "Bagumbayan",
    "Bubucal",
    "Cabooan",
    "Calangay",
    "Cambuja",
    "Coralan",
    "Cueva",
    "Inayapan",
    "Jose P. Laurel, Sr.",
    "Jose P. Rizal",
    "Juan Santiago",
    "Kayhacat",
    "Macasipac",
    "Masinao",
    "Matalinting",
    "Pao-o",
    "Parang ng Buho",
    "Poblacion Dos",
    "Poblacion Quatro",
    "Poblacion Tres",
    "Poblacion Uno",
    "Talangka",
    "Tungkod"
  ];

  // Mock data structure
  const dashboardData = {
    "All": {
      population: [43, 44, 46, 46, 48, 50, 51, 53, 54, 56, 57, 62],
      growth: [10, 12, 8, 15],
      distribution: [150, 80, 10],
      ageGroups: [25, 45, 30, 15, 10],
      employmentStatus: [120, 80],  // [Beneficiaries, Non-Beneficiaries]
      educationLevel: [30, 45, 55, 35],
      incomeDistribution: [20, 35, 45, 30, 10],
      applicationStatus: [150, 50, 30],
      assistanceTypes: [40, 35, 45, 30, 20]
    },
    "Adia": {
      population: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      growth: [2, 3, 1, 4],
      distribution: [20, 10, 5],
      ageGroups: [5, 8, 6, 3, 2],
      employmentStatus: [15, 10],  // [Beneficiaries, Non-Beneficiaries]
      educationLevel: [5, 8, 10, 7],
      incomeDistribution: [3, 5, 7, 5, 2],
      applicationStatus: [20, 5, 3],
      assistanceTypes: [5, 4, 6, 4, 3]
    },
    "Bagong Pook": {
      population: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      growth: [1, 2, 1, 3],
      distribution: [15, 8, 4],
      ageGroups: [4, 7, 5, 2, 1],
      employmentStatus: [12, 8],  // [Beneficiaries, Non-Beneficiaries]
      educationLevel: [4, 6, 8, 5],
      incomeDistribution: [2, 4, 6, 4, 1],
      applicationStatus: [15, 4, 2],
      assistanceTypes: [4, 3, 5, 3, 2]
    }
  };

  // Add default data for other barangays
  barangays.forEach(brgy => {
    if (!dashboardData[brgy] && brgy !== "All") {
      dashboardData[brgy] = {
        population: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        growth: [1, 2, 1, 2],
        distribution: [10, 5, 3],
        ageGroups: [3, 5, 4, 2, 1],
        employmentStatus: [8, 5, 3],
        educationLevel: [3, 4, 6, 3],
        incomeDistribution: [2, 3, 4, 3, 1],
        applicationStatus: [10, 3, 2],
        assistanceTypes: [3, 2, 4, 2, 1]
      };
    }
  });

  // Fetch accepted users data
  useEffect(() => {
    const fetchAcceptedUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8081/accepted-users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAcceptedUsers(data);
      } catch (error) {
        console.error('Error fetching accepted users:', error);
        setError('Failed to load accepted users. Please make sure the backend server is running.');
        // Set some mock data for development
        setAcceptedUsers([
          { id: 1, name: "John Doe", accepted_at: "2024-03-30T10:00:00Z" },
          { id: 2, name: "Jane Smith", accepted_at: "2024-03-29T15:30:00Z" },
          { id: 3, name: "Mike Johnson", accepted_at: "2024-03-28T09:15:00Z" }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcceptedUsers();
  }, []);

  // Fetch monthly population data
  useEffect(() => {
    const fetchMonthlyPopulation = async () => {
      try {
        // Build the query string with filters
        let queryParams = [];
        if (selectedBrgy !== "All") {
          queryParams.push(`barangay=${selectedBrgy}`);
        }
        if (startDate && endDate) {
          queryParams.push(`startDate=${startDate}`);
          queryParams.push(`endDate=${endDate}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const response = await fetch(`${API_URL}/polulations-users${queryString}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Initialize data for all months of the selected year
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = Array(12).fill(0);
        
        // Fill in actual data
        data.forEach(user => {
          const date = new Date(user.accepted_at);
          const month = date.getMonth();
          monthlyData[month]++;
        });

        setMonthlyPopulation({
          labels: monthNames,
          datasets: [{
            label: 'Monthly Population',
            data: monthlyData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          }]
        });
      } catch (error) {
        console.error('Error fetching monthly population:', error);
        setError('Failed to load monthly population data.');
        // Set empty data instead of mock data when there's an error
        setMonthlyPopulation({
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [{
            label: 'Monthly Population',
            data: Array(12).fill(0), // Set all months to 0 instead of mock data
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          }]
        });
      }
    };

    fetchMonthlyPopulation();
  }, [selectedBrgy, startDate, endDate]);

  // Update useEffect for beneficiaries to use selectedBrgy
  useEffect(() => {
    const fetchBeneficiariesData = async () => {
      try {
        const response = await fetch(`${API_URL}/beneficiaries-users${
          selectedBrgy !== "All" ? `?barangay=${selectedBrgy}` : ''
        }`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBeneficiariesData({
          beneficiaries: data.beneficiaries,
          nonBeneficiaries: data.nonBeneficiaries
        });
      } catch (error) {
        console.error('Error fetching beneficiaries data:', error);
        // Use mock data on error
        setBeneficiariesData({
          beneficiaries: 120,
          nonBeneficiaries: 80
        });
      }
    };

    fetchBeneficiariesData();
  }, [selectedBrgy]); // Add selectedBrgy as dependency
  
  // Add useEffect for children count data
  useEffect(() => {
    const fetchChildrenCountData = async () => {
      try {
        // Build the query string with filters
        let queryParams = [];
        if (selectedBrgy !== "All") {
          queryParams.push(`barangay=${selectedBrgy}`);
        }
        if (startDate && endDate) {
          queryParams.push(`startDate=${startDate}`);
          queryParams.push(`endDate=${endDate}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const response = await fetch(`${API_URL}/children-count-data-superadmin${queryString}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        setChildrenCountData({
          childrenCountDistribution: data.childrenCountDistribution || []
        });
      } catch (error) {
        console.error('Error fetching children count data:', error);
        // Use mock data on error
        setChildrenCountData({
          childrenCountDistribution: [
            { count: '0', frequency: 10 },
            { count: '1', frequency: 25 },
            { count: '2', frequency: 18 },
            { count: '3', frequency: 12 },
            { count: '4', frequency: 8 },
            { count: '5', frequency: 5 },
            { count: '6+', frequency: 3 }
          ]
        });
      }
    };

    fetchChildrenCountData();
  }, [selectedBrgy, startDate, endDate]);
  
  // Add useEffect for children age data
  useEffect(() => {
    const fetchChildrenAgeData = async () => {
      try {
        // Build the query string with filters
        let queryParams = [];
        if (selectedBrgy !== "All") {
          queryParams.push(`barangay=${selectedBrgy}`);
        }
        if (startDate && endDate) {
          queryParams.push(`startDate=${startDate}`);
          queryParams.push(`endDate=${endDate}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const response = await fetch(`${API_URL}/children-age-data${queryString}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        setChildrenAgeData({
          ageGroups: data.ageGroups || {
            '0-5': 0,
            '6-12': 0,
            '13-17': 0,
            '18-21': 0,
            '22+': 0
          },
          rawData: data.rawData || []
        });
      } catch (error) {
        console.error('Error fetching children age data:', error);
        // Use mock data on error
        setChildrenAgeData({
          ageGroups: {
            '0-5': 15,
            '6-12': 25,
            '13-17': 18,
            '18-21': 10,
            '22+': 5
          },
          rawData: [
            { age: 2, count: 5 },
            { age: 4, count: 10 },
            { age: 8, count: 12 },
            { age: 10, count: 13 },
            { age: 15, count: 8 },
            { age: 17, count: 10 },
            { age: 19, count: 6 },
            { age: 21, count: 4 },
            { age: 23, count: 3 },
            { age: 25, count: 2 }
          ]
        });
      }
    };

    fetchChildrenAgeData();
  }, [selectedBrgy, startDate, endDate]);
  
  // Add useEffect for age data analysis
  useEffect(() => {
    const fetchAgeData = async () => {
      try {
        // Build the query string with filters
        let queryParams = [];
        if (selectedBrgy !== "All") {
          queryParams.push(`barangay=${selectedBrgy}`);
        }
        if (startDate && endDate) {
          queryParams.push(`startDate=${startDate}`);
          queryParams.push(`endDate=${endDate}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const response = await fetch(`${API_URL}/users-age-data${queryString}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Process the age data
        if (data && data.length > 0) {
          // Calculate ages using the calculateAge function
          const ages = data.map(user => {
            if (!user.birthdate) return null;
            
            const birthDate = new Date(user.birthdate);
            const today = new Date();
            
            // Check if birthdate is valid
            if (isNaN(birthDate.getTime())) return null;
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            // If birthday hasn't occurred yet this year, subtract 1
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            
            return age;
          }).filter(age => age !== null);
          
          // Sort ages for distribution
          const sortedAges = [...ages].sort((a, b) => a - b);
          
          // Get highest and lowest ages
          const highestAge = sortedAges.length > 0 ? sortedAges[sortedAges.length - 1] : 0;
          const lowestAge = sortedAges.length > 0 ? sortedAges[0] : 0;
          
          // Create age distribution data with frequency counting
          const ageFrequency = {};
          sortedAges.forEach(age => {
            const ageStr = age.toString();
            if (ageFrequency[ageStr]) {
              ageFrequency[ageStr]++;
            } else {
              ageFrequency[ageStr] = 1;
            }
          });
          
          // Convert to array and take top 10 most frequent ages
          const ageDistribution = Object.entries(ageFrequency)
            .map(([age, count]) => ({ age, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          
          setAgeData({
            highestAge,
            lowestAge,
            ageDistribution
          });
        } else {
          // Set default values if no data
          setAgeData({
            highestAge: 0,
            lowestAge: 0,
            ageDistribution: []
          });
        }
      } catch (error) {
        console.error('Error fetching age data:', error);
        // Use mock data on error
        const mockAgeData = [
          { age: '0', count: 8 },
          { age: '1', count: 5 },
          { age: '2', count: 7 },
          { age: '3', count: 6 },
          { age: '4', count: 9 },
          { age: '5', count: 12 },
          { age: '6', count: 10 },
          { age: '7', count: 8 },
          { age: '8', count: 7 },
          { age: '9', count: 5 }
        ];
        
        setAgeData({
          highestAge: 65,
          lowestAge: 0,
          ageDistribution: mockAgeData
        });
      }
    };

    fetchAgeData();
  }, [selectedBrgy, startDate, endDate]);

  // Add new useEffect for application status
  useEffect(() => {
    const fetchApplicationStatus = async () => {
      try {
        // Build the query string with filters
        let queryParams = [];
        if (selectedBrgy !== "All") {
          queryParams.push(`barangay=${selectedBrgy}`);
        }
        if (startDate && endDate) {
          queryParams.push(`startDate=${startDate}`);
          queryParams.push(`endDate=${endDate}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const response = await fetch(`${API_URL}/application-status${queryString}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        setApplicationStatusData({
          declined: data.declined || 0,
          pending: data.pending || 0,
          accepted: data.accepted || 0  // This will include both Created and Verified
        });
      } catch (error) {
        console.error('Error fetching application status:', error);
        setApplicationStatusData({
          declined: 0,
          pending: 0,
          accepted: 0
        });
      }
    };

    fetchApplicationStatus();
  }, [selectedBrgy, startDate, endDate]);

  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
        chartsRef.current.forEach(chart => {
          if (chart) {
            chart.getEchartsInstance().resize();
          }
        });
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const getFontSize = (baseSize) => {
    if (windowWidth < 480) return baseSize - 2;
    if (windowWidth < 768) return baseSize - 1;
    return baseSize;
  };

  const commonConfig = {
    grid: {
      top: 60,
      left: '8%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { 
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      padding: [10, 15]
    }
  };

  const populationOption = {
    title: {
      text: 'Monthly Population Trend',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: monthlyPopulation.labels || [],
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      axisLine: {
        lineStyle: { color: '#eee' }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      splitLine: {
        lineStyle: { 
          color: '#f5f5f5',
          type: 'dashed'
        }
      }
    },
    series: [{
      name: 'Population',
      type: 'line',
      smooth: false,
      symbolSize: 8,
      data: monthlyPopulation.datasets?.[0]?.data || [],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(22, 196, 127, 0.35)'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.05)'
          }]
        }
      },
      itemStyle: { 
        color: '#16C47F',
        borderWidth: 2,
        borderColor: '#fff'
      },
      emphasis: {
        itemStyle: {
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(22, 196, 127, 0.3)'
        }
      }
    }]
  };

  const ageDistributionOption = {
    title: {
      text: 'Application Status',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const param = params[0];
        let statusText = param.name;
        if (param.name === 'Accepted') {
          statusText = 'Accepted (Verified and Created)';
        }
        return `${statusText}: ${param.value}`;
      }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ['Declined', 'Pending', 'Accepted'],
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666',
        interval: 0,  // Force show all labels
        rotate: 0     // No rotation
      },
      axisTick: {
        alignWithLabel: true
      },
      axisLine: {
        lineStyle: { color: '#eee' }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      splitLine: {
        lineStyle: { 
          color: '#f5f5f5',
          type: 'dashed'
        }
      }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',  // Adjust bar width
      data: [
        applicationStatusData.declined,
        applicationStatusData.pending,
        applicationStatusData.accepted
      ],
      itemStyle: {
        color: function(params) {
          // Different colors for each status
          const colors = {
            0: '#FF6B6B',  // Red for Declined
            1: '#FFB236',  // Orange for Pending
            2: '#16C47F'   // Green for Accepted
          };
          return colors[params.dataIndex];
        },
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      },
      label: {
        show: true,
        position: 'top',
        fontSize: getFontSize(11),
        color: '#666'
      }
    }]
  };

  const employmentOption = {
    title: {
      text: 'Beneficiary Status',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    ...commonConfig,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      name: 'Beneficiary Status',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: getFontSize(14),
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { 
          value: beneficiariesData.beneficiaries, 
          name: 'Beneficiaries',
          itemStyle: { color: '#16C47F' }
        },
        { 
          value: beneficiariesData.nonBeneficiaries, 
          name: 'Non-Beneficiaries',
          itemStyle: { color: '#FF6B6B' }
        }
      ]
    }]
  };
  
  // Add children age distribution chart option
  const childrenAgeOption = {
    title: {
      text: 'Children Age Distribution',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    ...commonConfig,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        return `${params[0].name}: ${params[0].value} children`;
      }
    },
    xAxis: {
      type: 'category',
      data: Object.keys(childrenAgeData.ageGroups),
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666',
        interval: 0
      },
      axisTick: {
        alignWithLabel: true
      },
      axisLine: {
        lineStyle: { color: '#eee' }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Children',
      nameTextStyle: {
        fontSize: getFontSize(11),
        color: '#666',
        padding: [0, 0, 10, 0]
      },
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      splitLine: {
        lineStyle: { 
          color: '#f5f5f5',
          type: 'dashed'
        }
      }
    },
    series: [{
      name: 'Children Age',
      type: 'bar',
      barWidth: '60%',
      data: Object.values(childrenAgeData.ageGroups),
      itemStyle: {
        color: function(params) {
          // Different colors for each age group
          const colors = ['#4ECDC4', '#FF6B6B', '#FFD166', '#118AB2', '#073B4C'];
          return colors[params.dataIndex % colors.length];
        },
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      },
      label: {
        show: true,
        position: 'top',
        fontSize: getFontSize(11),
        color: '#666'
      }
    }]
  };
  
  const educationOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: { color: '#333' }
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { 
        fontSize: getFontSize(11),
        color: '#666'
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 5,
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)'
        }
      },
      data: [
        { 
          value: beneficiariesData.beneficiaries, 
          name: 'Beneficiaries',
          itemStyle: { color: '#16C47F' }
        },
        { 
          value: beneficiariesData.nonBeneficiaries, 
          name: 'Non-Beneficiaries',
          itemStyle: { color: '#FF6B6B' }
        }
      ]
    }]
  };

  const getChildrenCountChartOptions = () => {
    // Use real children count data from state
    const childrenDistribution = childrenCountData.childrenCountDistribution.length > 0 ? 
      childrenCountData.childrenCountDistribution : 
      [{ count: '0', frequency: 0 }]; // Fallback if no data
    
    return {
      title: {
        text: 'Bilang ng Anak ng mga Solo Parent',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} solo parents',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: childrenDistribution.map(item => item.count),
        axisLabel: {
          fontSize: getFontSize(11),
          color: '#666'
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        name: 'Bilang ng Solo Parents',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          fontSize: getFontSize(11),
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#f5f5f5',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Solo Parents',
        type: 'bar',
        barWidth: '60%',
        data: childrenDistribution.map(item => item.frequency),
        itemStyle: {
          color: function(params) {
            // Different colors for different bars
            const colors = ['#FF6B6B', '#FFB236', '#16C47F', '#4D96FF', '#9C27B0', '#607D8B', '#795548'];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          fontSize: getFontSize(11),
          color: '#666'
        }
      }]
    };
  };
  
  const getAgeChartOptions = () => {
    // Use real age data from state instead of mock data
    const ageDistribution = ageData.ageDistribution.length > 0 ? 
      ageData.ageDistribution : 
      [{ age: '0', count: 0 }]; // Fallback if no data
    
    return {
      title: {
        text: `Age (Lowest: ${ageData.lowestAge} - Highest: ${ageData.highestAge})`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `Age ${params[0].name}`;
        }
      },
      xAxis: {
        type: 'category',
        data: ageDistribution.map(item => item.age),
        axisLabel: {
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        show: false
      },
      series: [
        {
          type: 'bar',
          data: ageDistribution.map(item => item.count), // Use actual count for bar height
          label: {
            show: true,
            position: 'top',
            formatter: function(params) {
              return `${ageDistribution[params.dataIndex].age} (${params.value})`;
            }
          },
          itemStyle: {
            color: '#91CC75'
          }
        }
      ]
    };
  };

  
  // Update generateExcelReport to include beneficiary data
  const generateExcelReport = async () => {
    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates for the report');
      return;
    }

    if (!validateDates(startDate, endDate)) {
      return;
    }

    try {
      // Fetch population data with date range
      const populationResponse = await fetch(
        `${API_URL}/polulations-users?${
          selectedBrgy !== "All" ? `barangay=${selectedBrgy}&` : ''
        }startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!populationResponse.ok) {
        throw new Error('Failed to fetch population data');
      }

      const populationData = await populationResponse.json();

      // Fetch beneficiaries data with date range
      const beneficiariesResponse = await fetch(
        `${API_URL}/beneficiaries-users?${
          selectedBrgy !== "All" ? `barangay=${selectedBrgy}&` : ''
        }startDate=${startDate}&endDate=${endDate}`
      );

      if (!beneficiariesResponse.ok) {
        throw new Error('Failed to fetch beneficiaries data');
      }

      const beneficiariesData = await beneficiariesResponse.json();

      // Fetch application status data
      const applicationStatusResponse = await fetch(
        `${API_URL}/application-status?${
          selectedBrgy !== "All" ? `barangay=${selectedBrgy}&` : ''
        }startDate=${startDate}&endDate=${endDate}`
      );

      if (!applicationStatusResponse.ok) {
        throw new Error('Failed to fetch application status data');
      }

      const applicationStatusData = await applicationStatusResponse.json();

      // Count users by status
      const statusCounts = populationData.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {});

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summarySheet = XLSX.utils.json_to_sheet([
        { 
          Barangay: selectedBrgy,
          StartDate: new Date(startDate).toLocaleDateString(),
          EndDate: new Date(endDate).toLocaleDateString(),
          TotalPopulation: populationData.length,
          VerifiedUsers: statusCounts['Verified'] || 0,
          PendingRemarksUsers: statusCounts['Pending Remarks'] || 0,
          TerminatedUsers: statusCounts['Terminated'] || 0,
          BeneficiariesInDateRange: beneficiariesData.beneficiaries,
          NonBeneficiariesInDateRange: beneficiariesData.nonBeneficiaries
        }
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Sheet 2: Monthly Population Data
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December"];
      const monthlyData = Array(12).fill(0);
      
      populationData.forEach(user => {
        const date = new Date(user.accepted_at);
        const month = date.getMonth();
        monthlyData[month]++;
      });

      const monthlyPopulationSheet = XLSX.utils.json_to_sheet(
        monthNames.map((month, index) => ({
          Month: month,
          Population: monthlyData[index]
        }))
      );
      XLSX.utils.book_append_sheet(wb, monthlyPopulationSheet, "Monthly Population");

      // Sheet 3: Beneficiaries Data
      const beneficiariesSheet = XLSX.utils.json_to_sheet([
        {
          Category: 'Beneficiaries',
          Count: beneficiariesData.beneficiaries
        },
        {
          Category: 'Non-Beneficiaries',
          Count: beneficiariesData.nonBeneficiaries
        }
      ]);
      XLSX.utils.book_append_sheet(wb, beneficiariesSheet, "Beneficiaries Status");

      // Sheet 4: Application Status
      const applicationStatusSheet = XLSX.utils.json_to_sheet([
        {
          Status: 'Declined',
          Count: applicationStatusData.declined || 0
        },
        {
          Status: 'Pending',
          Count: applicationStatusData.pending || 0
        },
        {
          Status: 'Accepted',
          Count: applicationStatusData.accepted || 0  // This includes both Verified and Created
        }
      ]);
      XLSX.utils.book_append_sheet(wb, applicationStatusSheet, "Application Status");
      
      // Sheet 5: Age Data
      const ageDataSheet = XLSX.utils.json_to_sheet([
        {
          Category: 'Lowest Age',
          Value: ageData.lowestAge
        },
        {
          Category: 'Highest Age',
          Value: ageData.highestAge
        }
      ]);
      XLSX.utils.book_append_sheet(wb, ageDataSheet, "Age Statistics");

      // Sheet 6: Children Count Data
      const childrenCountSheet = XLSX.utils.json_to_sheet(
        childrenCountData.childrenCountDistribution.map(item => ({
          'Number of Children': item.count,
          'Number of Solo Parents': item.frequency
        }))
      );
      XLSX.utils.book_append_sheet(wb, childrenCountSheet, "Children Count");

      // Sheet 7: Children Age Data
      const childrenAgeSheet = XLSX.utils.json_to_sheet([
        {
          'Age Group': '0-5',
          'Count': childrenAgeData.ageGroups['0-5']
        },
        {
          'Age Group': '6-12',
          'Count': childrenAgeData.ageGroups['6-12']
        },
        {
          'Age Group': '13-17',
          'Count': childrenAgeData.ageGroups['13-17']
        },
        {
          'Age Group': '18-21',
          'Count': childrenAgeData.ageGroups['18-21']
        },
        {
          'Age Group': '22+',
          'Count': childrenAgeData.ageGroups['22+']
        }
      ]);
      XLSX.utils.book_append_sheet(wb, childrenAgeSheet, "Children Age Distribution");

      // Save the workbook
      XLSX.writeFile(wb, `Dashboard_Report_${selectedBrgy}_${startDate}_to_${endDate}.xlsx`);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  return (
    <div className="superadmin-dashboard">
      <div className="superadmin-dashboard-header">
        <div className="superadmin-header-content">
          <h1 className="superadmin-dashboard-title">Analytics Overview</h1>
          <p className="superadmin-dashboard-subtitle">Monitor and analyze your data</p>
        </div>
        <div className="superadmin-controls-wrapper">
          <div className="superadmin-filters-container">
            <div className="superadmin-filter-item">
              <label htmlFor="superadmin-barangay-select">Barangay</label>
              <select 
                id="superadmin-barangay-select"
                value={selectedBrgy} 
                onChange={(e) => setSelectedBrgy(e.target.value)}
                className="superadmin-filter-select"
              >
                {barangays.map((brgy) => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
            </div>
            <div className="superadmin-filter-item">
              <label htmlFor="start-date">Start Date</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={handleStartDateChange}
                className="superadmin-filter-select"
                max={getMaxDateForInput()}
              />
            </div>
            <div className="superadmin-filter-item">
              <label htmlFor="end-date">End Date</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={handleEndDateChange}
                className="superadmin-filter-select"
                max={getMaxDateForInput()}
              />
            </div>
            {dateError && <div className="superadmin-date-error">{dateError}</div>}
            <button 
              className="superadmin-generate-btn" 
              onClick={generateExcelReport}
              title="Generate Excel Report"
            >
              <i className="fas fa-file-excel"></i>
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="superadmin-charts-grid">
        <div className="superadmin-chart-card superadmin-population-trend">
          <h2>Monthly Population Trend</h2>
          <ReactECharts 
            ref={(e) => { chartsRef.current[0] = e; }}
            option={populationOption}
            style={{ height: '350px', width: '100%' }}
          />
        </div>

        <div className="superadmin-chart-card">
          <h2>Application Status</h2>
          <ReactECharts 
            ref={(e) => { chartsRef.current[1] = e; }}
            option={ageDistributionOption}
            style={{ height: '300px', width: '100%' }}
          />
        </div>

        <div className="superadmin-chart-card">
          <h2>Beneficiary Status</h2>
          <ReactECharts 
            ref={(e) => { chartsRef.current[2] = e; }}
            option={employmentOption}
            style={{ height: '300px', width: '100%' }}
          />
        </div>

        <div className="superadmin-chart-card">
          <h2>Age of Solo Parents</h2>
          <ReactECharts 
            ref={(e) => { chartsRef.current[3] = e; }}
            option={getAgeChartOptions()}
            style={{ height: '300px', width: '100%' }}
          />
        </div>

        <div className="superadmin-chart-card">
          <h2>Number of Children</h2>
          <ReactECharts 
            ref={(e) => { chartsRef.current[4] = e; }}
            option={getChildrenCountChartOptions()}
            style={{ height: '300px', width: '100%' }}
          />
        </div>

        <div className="superadmin-chart-card">
          <h2>Children Age Distribution</h2>
          <ReactECharts 
            ref={(e) => { chartsRef.current[5] = e; }}
            option={childrenAgeOption}
            style={{ height: '300px', width: '100%' }}
          />
        </div>

        <div className="superadmin-data-table-container">
          <h2>Accepted Users</h2>
          {error && (
            <div className="error-message">{error}</div>
          )}
          <div className="table-responsive">
            {isLoading ? (
              <div className="loading-message">Loading accepted users...</div>
            ) : (
              <table className="accepted-users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Accepted At</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedUsers.map((user, index) => (
                    <tr key={`${user.name}-${user.accepted_at}-${index}`}>
                      <td>{index + 1}</td>
                      <td><strong>{user.name}</strong></td>
                      <td>{new Date(user.accepted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SDashboard;