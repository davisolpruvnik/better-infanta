export interface CmciRecord {
  year: number;
  category: '3rd-6th Class' | '1st Class';
  overallRank: number;
  overallScore: number;
  pillars: {
    economicDynamism: { rank: number; score: number };
    governmentEfficiency: { rank: number; score: number };
    infrastructure: { rank: number; score: number };
    resiliency?: { rank: number; score: number };
    innovation?: { rank: number; score: number };
  };
}

export const INFANTA_CMCI_DATA: CmciRecord[] = [
  {
    year: 2015,
    category: '3rd-6th Class',
    overallRank: 3,
    overallScore: 42.7485,
    pillars: {
      economicDynamism: { rank: 6, score: 13.0296 },
      governmentEfficiency: { rank: 73, score: 15.737 },
      infrastructure: { rank: 3, score: 13.98 },
    },
  },
  {
    year: 2016, // #1 Most Competitive 3rd-6th Class Municipality in the Philippines
    category: '3rd-6th Class',
    overallRank: 1,
    overallScore: 36.9687,
    pillars: {
      economicDynamism: { rank: 5, score: 11.6726 },
      governmentEfficiency: { rank: 69, score: 11.3657 },
      infrastructure: { rank: 1, score: 13.9304 },
    },
  },
  {
    year: 2017, // Transition to 1st Class category (competing against top municipal giants)
    category: '1st Class',
    overallRank: 95,
    overallScore: 37.7778,
    pillars: {
      economicDynamism: { rank: 163, score: 4.7229 },
      governmentEfficiency: { rank: 97, score: 10.7544 },
      infrastructure: { rank: 200, score: 6.0351 },
      resiliency: { rank: 75, score: 16.2654 },
    },
  },
  {
    year: 2018,
    category: '1st Class',
    overallRank: 193,
    overallScore: 0,
    pillars: {
      economicDynamism: { rank: 314, score: 0 },
      governmentEfficiency: { rank: 142, score: 0 },
      infrastructure: { rank: 234, score: 0 },
      resiliency: { rank: 204, score: 0 },
    },
  },
  {
    year: 2019,
    category: '1st Class',
    overallRank: 175,
    overallScore: 36.3528,
    pillars: {
      economicDynamism: { rank: 258, score: 3.7219 },
      governmentEfficiency: { rank: 115, score: 10.7931 },
      infrastructure: { rank: 134, score: 5.9496 },
      resiliency: { rank: 334, score: 15.8882 },
    },
  },
  {
    year: 2020,
    category: '1st Class',
    overallRank: 110,
    overallScore: 38.6656,
    pillars: {
      economicDynamism: { rank: 163, score: 4.7035 },
      governmentEfficiency: { rank: 116, score: 10.7322 },
      infrastructure: { rank: 99, score: 6.1618 },
      resiliency: { rank: 118, score: 17.0681 },
    },
  },
  {
    year: 2021,
    category: '1st Class',
    overallRank: 172,
    overallScore: 33.0531,
    pillars: {
      economicDynamism: { rank: 285, score: 4.4443 },
      governmentEfficiency: { rank: 128, score: 9.7518 },
      infrastructure: { rank: 241, score: 5.4278 },
      resiliency: { rank: 156, score: 13.4293 },
    },
  },
  {
    year: 2022,
    category: '1st Class',
    overallRank: 144,
    overallScore: 30.7116,
    pillars: {
      economicDynamism: { rank: 138, score: 4.6056 },
      governmentEfficiency: { rank: 157, score: 7.7329 },
      infrastructure: { rank: 129, score: 2.4990 },
      resiliency: { rank: 177, score: 11.4127 },
      innovation: { rank: 178, score: 4.4614 },
    },
  },
  {
    year: 2023,
    category: '1st Class',
    overallRank: 58,
    overallScore: 36.0157,
    pillars: {
      economicDynamism: { rank: 152, score: 3.6525 },
      governmentEfficiency: { rank: 196, score: 9.2743 },
      infrastructure: { rank: 158, score: 2.8431 },
      resiliency: { rank: 200, score: 11.3696 },
      innovation: { rank: 10, score: 8.8762 },
    },
  },
  {
    year: 2024,
    category: '1st Class',
    overallRank: 89,
    overallScore: 34.2930,
    pillars: {
      economicDynamism: { rank: 123, score: 3.8612 },
      governmentEfficiency: { rank: 193, score: 8.7016 },
      infrastructure: { rank: 133, score: 2.6611 },
      resiliency: { rank: 121, score: 11.5099 },
      innovation: { rank: 49, score: 7.5592 },
    },
  },
];
