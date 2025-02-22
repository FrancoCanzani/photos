'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

interface Moment {
  id: number;
  user_id: string | null;
  event_id: number;
  file_path: string;
  key: string;
  bucket: string;
  uploaded_at: string;
  updated_at: string;
  size: number;
  type: string;
  name: string;
}

function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

export const columns: ColumnDef<Moment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button
        className='w-full text-left'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
      </button>
    ),
    cell: ({ row }) => (
      <div className='truncate whitespace-nowrap font-medium max-w-[250px]'>
        {row.getValue('name')}
      </div>
    ),
  },
  {
    accessorKey: 'uploaded_at',
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Upload Date
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className=''>
          {new Date(row.getValue('uploaded_at')).toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'size',
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Size
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className=''>{bytesToMB(row.getValue('size')).toFixed(1)} mb</div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type
        </button>
      );
    },
    cell: ({ row }) => {
      return <div className='capitalize'>{row.getValue('type')}</div>;
    },
  },
];
