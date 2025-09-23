// lib/search-service.ts
import { QUOTE_DETAILS } from './dummy-data';
import { clients, materials } from '@/constants';

export interface SearchResult {
  type: 'quote' | 'client' | 'material';
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  relevance: number;
}

export interface SearchOptions {
  query: string;
  types?: ('quote' | 'client' | 'material')[];
  limit?: number;
}

export class SearchService {
  private static instance: SearchService;
  
  private constructor() {}
  
  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public search(options: SearchOptions): SearchResult[] {
    const { query, types = ['quote', 'client', 'material'], limit = 20 } = options;
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return [];
    
    const results: SearchResult[] = [];
    
    // Search quotes
    if (types.includes('quote')) {
      const quoteResults = this.searchQuotes(searchTerm);
      results.push(...quoteResults);
    }
    
    // Search clients
    if (types.includes('client')) {
      const clientResults = this.searchClients(searchTerm);
      results.push(...clientResults);
    }
    
    // Search materials
    if (types.includes('material')) {
      const materialResults = this.searchMaterials(searchTerm);
      results.push(...materialResults);
    }
    
    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private searchQuotes(searchTerm: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    Object.values(QUOTE_DETAILS).forEach(quote => {
      let relevance = 0;
      let matchedFields: string[] = [];
      
      // Check quote ID
      if (quote.id.toLowerCase().includes(searchTerm)) {
        relevance += 10;
        matchedFields.push('ID');
      }
      
      // Check client name
      if (quote.clientName.toLowerCase().includes(searchTerm)) {
        relevance += 8;
        matchedFields.push('Client');
      }
      
      // Check contact person
      if (quote.client.contactPerson.toLowerCase().includes(searchTerm)) {
        relevance += 7;
        matchedFields.push('Contact');
      }
      
      // Check product
      if (quote.product.toLowerCase().includes(searchTerm)) {
        relevance += 6;
        matchedFields.push('Product');
      }
      
      // Check email
      if (quote.client.email.toLowerCase().includes(searchTerm)) {
        relevance += 5;
        matchedFields.push('Email');
      }
      
      // Check status
      if (quote.amounts.status.toLowerCase().includes(searchTerm)) {
        relevance += 3;
        matchedFields.push('Status');
      }
      
      if (relevance > 0) {
        results.push({
          type: 'quote',
          id: quote.id,
          title: quote.clientName,
          subtitle: quote.product,
          description: `${quote.client.contactPerson} • ${quote.amounts.status} • AED ${quote.amounts.total}`,
          url: `/quote-management?quote=${quote.id}`,
          relevance
        });
      }
    });
    
    return results;
  }

  private searchClients(searchTerm: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    clients.forEach(client => {
      let relevance = 0;
      let matchedFields: string[] = [];
      
      // Check company name
      if (client.companyName.toLowerCase().includes(searchTerm)) {
        relevance += 10;
        matchedFields.push('Company');
      }
      
      // Check contact person
      if (client.contactPerson.toLowerCase().includes(searchTerm)) {
        relevance += 8;
        matchedFields.push('Contact');
      }
      
      // Check email
      if (client.email.toLowerCase().includes(searchTerm)) {
        relevance += 6;
        matchedFields.push('Email');
      }
      
      // Check phone
      if (client.phone.toLowerCase().includes(searchTerm)) {
        relevance += 5;
        matchedFields.push('Phone');
      }
      
      if (relevance > 0) {
        results.push({
          type: 'client',
          id: client.id,
          title: client.companyName,
          subtitle: client.contactPerson,
          description: `${client.email} • ${client.phone} • ${client.status}`,
          url: `/client-management?client=${client.id}`,
          relevance
        });
      }
    });
    
    return results;
  }

  private searchMaterials(searchTerm: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    materials.forEach(material => {
      let relevance = 0;
      let matchedFields: string[] = [];
      
      // Check material name
      if (material.material.toLowerCase().includes(searchTerm)) {
        relevance += 10;
        matchedFields.push('Material');
      }
      
      // Check supplier
      if (material.supplier.toLowerCase().includes(searchTerm)) {
        relevance += 8;
        matchedFields.push('Supplier');
      }
      
      // Check cost
      if (material.cost.toString().includes(searchTerm)) {
        relevance += 3;
        matchedFields.push('Cost');
      }
      
      if (relevance > 0) {
        results.push({
          type: 'material',
          id: material.id,
          title: material.material,
          subtitle: material.supplier,
          description: `$${material.cost} ${material.unit} • ${material.status} • Updated: ${material.lastUpdated}`,
          url: `/supplier-management?material=${material.id}`,
          relevance
        });
      }
    });
    
    return results;
  }

  public getQuickSearchSuggestions(): { type: string; label: string; icon: string; count: number }[] {
    return [
      { type: 'quote', label: 'Quotes', icon: '📄', count: Object.keys(QUOTE_DETAILS).length },
      { type: 'client', label: 'Clients', icon: '👥', count: clients.length },
      { type: 'material', label: 'Materials', icon: '🏢', count: materials.length }
    ];
  }
}

export const searchService = SearchService.getInstance();
