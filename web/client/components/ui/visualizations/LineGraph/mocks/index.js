// @flow
import type {
  DataPoint,
  TimeSeries,
} from 'components/ui/visualizations/LineGraph/types';

function getRandomCount(minValue: number = 0, maxValue: number = 200): number {
  return minValue + Math.round(Math.random() * (maxValue - minValue));
}

function getRandomDate(minYear: number = 2001, maxYear: number = 2018): Date {
  const randomYear = minYear + Math.round(Math.random() * (maxYear - minYear));
  const randomMonth = Math.floor(Math.random() * 12);
  const randomDay = Math.floor(Math.random() * 28);
  const date = new Date(randomYear, randomMonth, randomDay);
  return date;
}

function generateGroupName(nameLength: number = 10): string {
  return Array.from({ length: nameLength })
    .map((_, i) => {
      let lowestCharCode = 97;
      if (i === 0) {
        lowestCharCode = 65;
      }
      const charCode = Math.round(lowestCharCode + Math.random() * 25);
      return String.fromCharCode(charCode);
    })
    .join('');
}

function generateGroupData(count: number): Array<DataPoint> {
  return Array.from({ length: count }).map(() => ({
    date: getRandomDate(),
    value: getRandomCount(),
  }));
}

export function createSampleData(
  groupCount: number = 3,
  numberOfDataPoints: number = 20,
): $ReadOnlyArray<TimeSeries> {
  const data = [];
  for (let i = 0; i < groupCount; i++) {
    const groupName = generateGroupName();
    const groupData = generateGroupData(numberOfDataPoints).sort(
      (a, b) => a.date - b.date,
    );
    const groupDimensions = { RegionName: 'Example Region' };
    data.push({
      name: groupName,
      data: groupData,
      dimensions: groupDimensions,
    });
  }
  return data;
}
