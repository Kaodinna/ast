import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export type FilterOptions = {
  search: string;
  type: string;
  location: string;
  hasDeadline: boolean;
  hasFunding: boolean;
};

interface OpportunityFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onSearch: () => void;
  opportunityTypes: string[];
}

const OpportunityFilters: React.FC<OpportunityFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  opportunityTypes
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setTempFilters(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const applyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
    onSearch();
  };
  
  const resetFilters = () => {
    const resetValues: FilterOptions = {
      search: '',
      type: '',
      location: '',
      hasDeadline: false,
      hasFunding: false
    };
    setTempFilters(resetValues);
    onFilterChange(resetValues);
    onSearch();
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterChange({ ...filters, search: tempFilters.search });
      onSearch();
    }
  };

  // Count active filters (excluding search)
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false;
    if (typeof value === 'boolean') return value;
    return value !== '';
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search opportunities..."
            className="pl-9"
            value={tempFilters.search}
            onChange={handleInputChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filter Opportunities</SheetTitle>
            </SheetHeader>
            
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Opportunity Type</Label>
                <Select
                  value={tempFilters.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {opportunityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Any location"
                  value={tempFilters.location}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hasDeadline" className="cursor-pointer">Has Deadline</Label>
                <Switch
                  id="hasDeadline"
                  checked={tempFilters.hasDeadline}
                  onCheckedChange={(checked) => handleSwitchChange('hasDeadline', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hasFunding" className="cursor-pointer">Has Funding</Label>
                <Switch
                  id="hasFunding"
                  checked={tempFilters.hasFunding}
                  onCheckedChange={(checked) => handleSwitchChange('hasFunding', checked)}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button className="flex-1" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default OpportunityFilters;