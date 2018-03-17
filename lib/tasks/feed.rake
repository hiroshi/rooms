namespace :feed do
  desc 'feed fetch'
  task fetch: :environment do
    require 'rss'
    require 'open-uri'
    url = 'https://news.ycombinator.com/rss'
    puts "Fetching feed: #{url}"
    rss = RSS::Parser.parse(open(url).read, false)
    rss.items.each do |item|
      if Message.where("meta->'src'->>'comments' = ?", item.comments).exists?
        puts "  skip: #{item.title} #{item.comments}"
        next
      end
      puts "  add:  #{item.title} #{item.comments}"
      content = <<~CONTENT
        #{item.title} / #{rss.channel.title}
        #{item.link}
        #{item.comments}
        #feed #HackerNews
      CONTENT
      Message.create!(room_id: 1, user_id: 2, meta: {src: item.as_json}, content: content)
    end
    ActionCable.server.broadcast('messages', refresh: true)
  end
end
