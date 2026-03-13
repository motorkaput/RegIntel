import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X, ChevronDown, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: number;
  title: string;
  originalFilename: string | null;
  jurisdiction: string;
  regulator: string;
  status: string;
  publishedAt?: string;
}

interface DocumentSelectorProps {
  mode: 'single' | 'multi';
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  filterStatus?: string;
  excludeIds?: number[];
  filterJurisdiction?: string;
  filterRegulator?: string;
}

export function DocumentSelector({
  mode,
  selectedIds,
  onSelectionChange,
  placeholder = "Select documents...",
  className,
  disabled = false,
  filterStatus = 'active',
  excludeIds = [],
  filterJurisdiction,
  filterRegulator
}: DocumentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/regtech/documents'],
  });

  const allDocuments = data?.documents || [];
  
  const documents = allDocuments.filter(doc => {
    if (filterStatus && doc.status !== filterStatus) return false;
    if (excludeIds.includes(doc.id)) return false;
    if (filterJurisdiction && filterJurisdiction !== 'all' && doc.jurisdiction !== filterJurisdiction) return false;
    if (filterRegulator && filterRegulator !== 'all' && doc.regulator !== filterRegulator) return false;
    return true;
  });

  const filteredDocuments = documents.filter(doc => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    const filename = (doc.originalFilename || '').toLowerCase();
    const title = (doc.title || '').toLowerCase();
    const regulator = (doc.regulator || '').toLowerCase();
    const jurisdiction = (doc.jurisdiction || '').toLowerCase();
    return filename.includes(searchLower) || 
           title.includes(searchLower) || 
           regulator.includes(searchLower) ||
           jurisdiction.includes(searchLower);
  });

  const selectedDocuments = documents.filter(doc => selectedIds.includes(doc.id));

  const getDisplayName = (doc: Document) => {
    return doc.originalFilename || doc.title || `Document ${doc.id}`;
  };

  const toggleDocument = (docId: number) => {
    if (mode === 'single') {
      onSelectionChange([docId]);
      setOpen(false);
    } else {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter(id => id !== docId));
      } else {
        onSelectionChange([...selectedIds, docId]);
      }
    }
  };

  const removeDocument = (docId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelectionChange(selectedIds.filter(id => id !== docId));
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelectionChange([]);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal min-h-[40px] h-auto py-2",
            !selectedIds.length && "text-muted-foreground",
            className
          )}
        >
          <div className="flex-1 flex flex-wrap gap-1 items-center">
            {selectedDocuments.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : mode === 'single' ? (
              <span className="truncate">{getDisplayName(selectedDocuments[0])}</span>
            ) : (
              <>
                {selectedDocuments.slice(0, 3).map(doc => (
                  <Badge
                    key={doc.id}
                    variant="secondary"
                    className="text-xs px-2 py-0.5 flex items-center gap-1"
                  >
                    <span className="truncate max-w-[120px]">{getDisplayName(doc)}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => removeDocument(doc.id, e)}
                    />
                  </Badge>
                ))}
                {selectedDocuments.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{selectedDocuments.length - 3} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selectedIds.length > 0 && mode === 'multi' && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={clearAll}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search by filename, title, regulator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {mode === 'multi' && selectedIds.length > 0 && (
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{selectedIds.length} document{selectedIds.length !== 1 ? 's' : ''} selected</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onSelectionChange([])}>
                Clear all
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {search ? "No documents match your search" : "No documents available"}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredDocuments.map(doc => {
                const isSelected = selectedIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-50 transition-colors",
                      isSelected && "bg-slate-50"
                    )}
                    onClick={() => toggleDocument(doc.id)}
                  >
                    {mode === 'multi' ? (
                      <Checkbox
                        checked={isSelected}
                        className="mt-1"
                      />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {getDisplayName(doc)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {doc.regulator}
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {doc.jurisdiction}
                        </Badge>
                        {doc.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
