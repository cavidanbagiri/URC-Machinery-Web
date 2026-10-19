import { BsChatDots } from 'react-icons/bs';

export default function Forum() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div style={{'fontFamily':'Inter'}}
         className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BsChatDots className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Forum
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-gray-500">
          Forum konularını buradan görüntüleyeceksiniz.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <BsChatDots className="mx-auto h-10 w-10 text-gray-300" />
        <h2 className="mt-3 text-base font-medium text-gray-700">
          Henüz konu yok
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Forum modülü yakında burada görünecek.
        </p>
      </div>
    </div>
  );
}
