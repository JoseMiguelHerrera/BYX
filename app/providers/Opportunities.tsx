import React from 'react'
import { OpportunityData } from '../api/dataModels';
import { useQuery } from '@tanstack/react-query';
import useOpportunitiesStore from '@/store/opportunities';

function OpportunitiesProvider() {
  const { setIsLoading, setOpportunities} = useOpportunitiesStore();
  
  const { data, isLoading, error } = useQuery<{ data: OpportunityData[] } >({
    queryKey: ["opportunities"],
    queryFn: async () => {

      const response = await fetch('/api/opportunities');
      const data = await response.json();
      return data;
    }
  });

  React.useEffect(() => {
    setIsLoading(isLoading);
    setOpportunities(data?.data || []);
  }, [data, isLoading]);

  return (<></>)
}

export default OpportunitiesProvider