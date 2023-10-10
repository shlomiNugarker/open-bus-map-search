import { useEffect, useState } from 'react'
import { Moment } from 'moment'
import { getGapsAsync } from '../api/gapsService'

import { sortByMode, HourlyData } from './components/utils'
import { GapsList } from 'src/model/gaps'

export const useGapsList = (
  fromDate: Moment,
  toDate: Moment,
  operatorRef: string,
  lineRef: number,
  sortingMode: string,
): HourlyData[] => {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gapsList: GapsList = await getGapsAsync(fromDate, toDate, operatorRef, lineRef)

        // Convert gapsList data into hourly mapping as needed
        const hourlyMapping: Record<string, { planned_rides: number; actual_rides: number }> = {}

        for (const ride of gapsList) {
          if (ride.gtfsTime === null) {
            continue
          }
          const plannedHour = ride.gtfsTime.format('HH:mm')

          if (!hourlyMapping[plannedHour]) {
            hourlyMapping[plannedHour] = { planned_rides: 0, actual_rides: 0 }
          }

          hourlyMapping[plannedHour].planned_rides += 1
          if (ride.siriTime) {
            hourlyMapping[plannedHour].actual_rides += 1
          }
        }

        const result: HourlyData[] = Object.entries(hourlyMapping).map(([hour, data]) => ({
          planned_hour: hour,
          actual_rides: data.actual_rides,
          planned_rides: data.planned_rides,
        })) 

        setHourlyData(sortByMode(result, sortingMode))
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [lineRef, operatorRef, fromDate, toDate, sortingMode])
  return hourlyData
}
